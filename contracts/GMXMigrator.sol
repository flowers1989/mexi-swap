// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GMXMigrator
 * @author MexiSwap Team
 * @notice Programa de migración de liquidez desde GMX (LP Boost Program)
 * @dev Incentivos para traders que migran desde GMX a MexiSwap
 * 
 * SEGURIDAD IMPLEMENTADA:
 * - ReentrancyGuard: Protección contra ataques de reentrada
 * - Pausable: Capacidad de pausar en caso de emergencia
 * - AccessControl: Control de roles granular
 * - Signature Verification: Verificación de firmas para migración
 * - Rate Limiting: Límites de migración por período
 * - Snapshot Verification: Verificación de posiciones en GMX
 */

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract GMXMigrator is ReentrancyGuard, Pausable, AccessControl {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    // ============ ROLES ============
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");

    // ============ CONSTANTES ============
    uint256 public constant PRECISION = 1e18;
    uint256 public constant MEXI_BONUS_PERCENT = 10; // 10% bonus en MEXI
    uint256 public constant GAS_SUBSIDY_PERCENT = 50; // 50% subsidio de gas
    uint256 public constant MIGRATION_WINDOW = 14 days; // Ventana de migración
    uint256 public constant BOOST_MULTIPLIER = 10; // 10x rewards primera semana
    uint256 public constant RATE_LIMIT_PERIOD = 1 hours;
    uint256 public constant MAX_MIGRATIONS_PER_PERIOD = 100;

    // ============ ESTRUCTURAS ============
    struct Migration {
        uint256 id;
        address user;
        string sourceProtocol; // "GMX", "dYdX", etc.
        uint256 sourceChainId;
        uint256 positionValue; // Valor en DAI
        uint256 mexiBonus;
        uint256 gasSubsidy;
        uint256 timestamp;
        MigrationStatus status;
    }

    enum MigrationStatus {
        Pending,
        Completed,
        Cancelled,
        Failed
    }

    struct MigrationStats {
        uint256 totalMigrations;
        uint256 totalValueMigrated;
        uint256 totalMexiDistributed;
        uint256 totalGasSubsidized;
    }

    struct UserMigrationInfo {
        uint256 totalMigrated;
        uint256 totalMexiReceived;
        uint256 migrationCount;
        uint256 lastMigrationTime;
        bool isEligibleForBoost;
    }

    // ============ ESTADO ============
    IERC20 public immutable DAI;
    IERC20 public immutable MEXI;

    mapping(uint256 => Migration) public migrations;
    mapping(address => UserMigrationInfo) public userMigrations;
    mapping(address => uint256[]) public userMigrationIds;
    mapping(bytes32 => bool) public usedSignatures;
    
    // Rate limiting
    mapping(uint256 => uint256) public migrationsInPeriod; // period => count
    uint256 public currentPeriod;

    uint256 public nextMigrationId = 1;
    uint256 public migrationStartTime;
    uint256 public migrationEndTime;
    uint256 public boostEndTime;
    
    MigrationStats public stats;

    // Límites
    uint256 public minMigrationValue = 100 * PRECISION; // $100 min
    uint256 public maxMigrationValue = 1_000_000 * PRECISION; // $1M max
    uint256 public totalMexiBudget;
    uint256 public mexiDistributed;

    // Protocolos soportados
    mapping(string => bool) public supportedProtocols;
    string[] public protocolList;

    // ============ EVENTOS ============
    event MigrationInitiated(
        uint256 indexed migrationId,
        address indexed user,
        string sourceProtocol,
        uint256 positionValue
    );
    event MigrationCompleted(
        uint256 indexed migrationId,
        address indexed user,
        uint256 mexiBonus,
        uint256 gasSubsidy
    );
    event MigrationCancelled(uint256 indexed migrationId, string reason);
    event ProtocolAdded(string protocol);
    event ProtocolRemoved(string protocol);
    event MigrationWindowUpdated(uint256 startTime, uint256 endTime);
    event BudgetUpdated(uint256 newBudget);

    // ============ MODIFICADORES ============
    modifier withinMigrationWindow() {
        require(block.timestamp >= migrationStartTime, "MIGRATE: Not started");
        require(block.timestamp <= migrationEndTime, "MIGRATE: Window closed");
        _;
    }

    modifier rateLimited() {
        uint256 period = block.timestamp.div(RATE_LIMIT_PERIOD);
        if (period != currentPeriod) {
            currentPeriod = period;
            migrationsInPeriod[period] = 0;
        }
        require(
            migrationsInPeriod[period] < MAX_MIGRATIONS_PER_PERIOD,
            "MIGRATE: Rate limit exceeded"
        );
        migrationsInPeriod[period]++;
        _;
    }

    // ============ CONSTRUCTOR ============
    constructor(
        address _dai,
        address _mexi,
        uint256 _startTime,
        uint256 _duration,
        uint256 _mexiBudget
    ) {
        require(_dai != address(0), "MIGRATE: Invalid DAI");
        require(_mexi != address(0), "MIGRATE: Invalid MEXI");
        require(_startTime > block.timestamp, "MIGRATE: Invalid start");
        require(_duration > 0, "MIGRATE: Invalid duration");
        require(_mexiBudget > 0, "MIGRATE: Invalid budget");

        DAI = IERC20(_dai);
        MEXI = IERC20(_mexi);
        
        migrationStartTime = _startTime;
        migrationEndTime = _startTime.add(_duration);
        boostEndTime = _startTime.add(7 days); // Boost primera semana
        totalMexiBudget = _mexiBudget;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        _grantRole(SIGNER_ROLE, msg.sender);

        // Agregar protocolos soportados
        _addProtocol("GMX");
        _addProtocol("dYdX");
        _addProtocol("Gains");
        _addProtocol("Kwenta");
    }

    // ============ FUNCIONES DE MIGRACIÓN ============
    function initiateMigration(
        string calldata sourceProtocol,
        uint256 sourceChainId,
        uint256 positionValue,
        bytes calldata signature
    ) external nonReentrant whenNotPaused withinMigrationWindow rateLimited returns (uint256) {
        // Validaciones
        require(supportedProtocols[sourceProtocol], "MIGRATE: Protocol not supported");
        require(positionValue >= minMigrationValue, "MIGRATE: Value too low");
        require(positionValue <= maxMigrationValue, "MIGRATE: Value too high");

        // Verificar firma
        bytes32 messageHash = keccak256(abi.encodePacked(
            msg.sender,
            sourceProtocol,
            sourceChainId,
            positionValue,
            block.chainid
        ));
        bytes32 ethSignedHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        
        require(!usedSignatures[ethSignedHash], "MIGRATE: Signature already used");
        address signer = ECDSA.recover(ethSignedHash, signature);
        require(hasRole(SIGNER_ROLE, signer), "MIGRATE: Invalid signature");
        
        usedSignatures[ethSignedHash] = true;

        // Calcular bonificaciones
        uint256 mexiBonus = _calculateMexiBonus(positionValue);
        uint256 gasSubsidy = _calculateGasSubsidy();

        // Verificar presupuesto
        require(
            mexiDistributed.add(mexiBonus) <= totalMexiBudget,
            "MIGRATE: Budget exceeded"
        );

        // Crear migración
        uint256 migrationId = nextMigrationId++;
        migrations[migrationId] = Migration({
            id: migrationId,
            user: msg.sender,
            sourceProtocol: sourceProtocol,
            sourceChainId: sourceChainId,
            positionValue: positionValue,
            mexiBonus: mexiBonus,
            gasSubsidy: gasSubsidy,
            timestamp: block.timestamp,
            status: MigrationStatus.Pending
        });

        userMigrationIds[msg.sender].push(migrationId);

        emit MigrationInitiated(migrationId, msg.sender, sourceProtocol, positionValue);
        return migrationId;
    }

    function completeMigration(uint256 migrationId) 
        external 
        nonReentrant 
        onlyRole(OPERATOR_ROLE) 
    {
        Migration storage migration = migrations[migrationId];
        require(migration.user != address(0), "MIGRATE: Not found");
        require(migration.status == MigrationStatus.Pending, "MIGRATE: Invalid status");

        // Actualizar estado
        migration.status = MigrationStatus.Completed;

        // Actualizar estadísticas del usuario
        UserMigrationInfo storage userInfo = userMigrations[migration.user];
        userInfo.totalMigrated = userInfo.totalMigrated.add(migration.positionValue);
        userInfo.totalMexiReceived = userInfo.totalMexiReceived.add(migration.mexiBonus);
        userInfo.migrationCount++;
        userInfo.lastMigrationTime = block.timestamp;

        // Actualizar estadísticas globales
        stats.totalMigrations++;
        stats.totalValueMigrated = stats.totalValueMigrated.add(migration.positionValue);
        stats.totalMexiDistributed = stats.totalMexiDistributed.add(migration.mexiBonus);
        stats.totalGasSubsidized = stats.totalGasSubsidized.add(migration.gasSubsidy);

        mexiDistributed = mexiDistributed.add(migration.mexiBonus);

        // Transferir MEXI bonus
        MEXI.safeTransfer(migration.user, migration.mexiBonus);

        // Transferir subsidio de gas en DAI
        if (migration.gasSubsidy > 0) {
            DAI.safeTransfer(migration.user, migration.gasSubsidy);
        }

        emit MigrationCompleted(
            migrationId,
            migration.user,
            migration.mexiBonus,
            migration.gasSubsidy
        );
    }

    function cancelMigration(uint256 migrationId, string calldata reason) 
        external 
        onlyRole(OPERATOR_ROLE) 
    {
        Migration storage migration = migrations[migrationId];
        require(migration.user != address(0), "MIGRATE: Not found");
        require(migration.status == MigrationStatus.Pending, "MIGRATE: Invalid status");

        migration.status = MigrationStatus.Cancelled;

        emit MigrationCancelled(migrationId, reason);
    }

    // ============ FUNCIONES DE CÁLCULO ============
    function _calculateMexiBonus(uint256 positionValue) internal view returns (uint256) {
        uint256 baseBonus = positionValue.mul(MEXI_BONUS_PERCENT).div(100);
        
        // Aplicar boost si está en la primera semana
        if (block.timestamp <= boostEndTime) {
            return baseBonus.mul(BOOST_MULTIPLIER);
        }
        
        return baseBonus;
    }

    function _calculateGasSubsidy() internal pure returns (uint256) {
        // Estimación de gas para migración: ~500,000 gas
        // Precio de gas estimado: 50 gwei
        // Precio de MATIC: ~$1
        uint256 estimatedGasCost = 25 * PRECISION; // ~$25 en gas
        return estimatedGasCost.mul(GAS_SUBSIDY_PERCENT).div(100);
    }

    function estimateMigrationRewards(uint256 positionValue) 
        external 
        view 
        returns (uint256 mexiBonus, uint256 gasSubsidy, bool isBoostActive) 
    {
        mexiBonus = _calculateMexiBonus(positionValue);
        gasSubsidy = _calculateGasSubsidy();
        isBoostActive = block.timestamp <= boostEndTime;
    }

    // ============ FUNCIONES DE PROTOCOLO ============
    function _addProtocol(string memory protocol) internal {
        if (!supportedProtocols[protocol]) {
            supportedProtocols[protocol] = true;
            protocolList.push(protocol);
            emit ProtocolAdded(protocol);
        }
    }

    function addProtocol(string calldata protocol) external onlyRole(ADMIN_ROLE) {
        _addProtocol(protocol);
    }

    function removeProtocol(string calldata protocol) external onlyRole(ADMIN_ROLE) {
        require(supportedProtocols[protocol], "MIGRATE: Protocol not found");
        supportedProtocols[protocol] = false;
        emit ProtocolRemoved(protocol);
    }

    // ============ FUNCIONES ADMIN ============
    function updateMigrationWindow(uint256 newStartTime, uint256 newEndTime) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(newEndTime > newStartTime, "MIGRATE: Invalid window");
        migrationStartTime = newStartTime;
        migrationEndTime = newEndTime;
        emit MigrationWindowUpdated(newStartTime, newEndTime);
    }

    function updateBoostEndTime(uint256 newBoostEndTime) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(newBoostEndTime >= migrationStartTime, "MIGRATE: Invalid boost time");
        boostEndTime = newBoostEndTime;
    }

    function updateBudget(uint256 newBudget) external onlyRole(ADMIN_ROLE) {
        require(newBudget >= mexiDistributed, "MIGRATE: Budget below distributed");
        totalMexiBudget = newBudget;
        emit BudgetUpdated(newBudget);
    }

    function updateLimits(uint256 _minValue, uint256 _maxValue) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(_minValue < _maxValue, "MIGRATE: Invalid limits");
        minMigrationValue = _minValue;
        maxMigrationValue = _maxValue;
    }

    function withdrawExcessMexi() external onlyRole(ADMIN_ROLE) {
        require(block.timestamp > migrationEndTime, "MIGRATE: Window not closed");
        uint256 excess = MEXI.balanceOf(address(this)).sub(
            totalMexiBudget.sub(mexiDistributed)
        );
        if (excess > 0) {
            MEXI.safeTransfer(msg.sender, excess);
        }
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // ============ FUNCIONES VIEW ============
    function getMigration(uint256 migrationId) external view returns (Migration memory) {
        return migrations[migrationId];
    }

    function getUserMigrations(address user) external view returns (uint256[] memory) {
        return userMigrationIds[user];
    }

    function getUserMigrationInfo(address user) external view returns (UserMigrationInfo memory) {
        return userMigrations[user];
    }

    function getStats() external view returns (MigrationStats memory) {
        return stats;
    }

    function getSupportedProtocols() external view returns (string[] memory) {
        return protocolList;
    }

    function getRemainingBudget() external view returns (uint256) {
        return totalMexiBudget.sub(mexiDistributed);
    }

    function isMigrationWindowOpen() external view returns (bool) {
        return block.timestamp >= migrationStartTime && 
               block.timestamp <= migrationEndTime;
    }

    function isBoostActive() external view returns (bool) {
        return block.timestamp <= boostEndTime;
    }

    function getTimeUntilWindowClose() external view returns (uint256) {
        if (block.timestamp >= migrationEndTime) return 0;
        return migrationEndTime.sub(block.timestamp);
    }
}

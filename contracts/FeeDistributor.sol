// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FeeDistributor
 * @author MexiSwap Team
 * @notice Distribuidor de comisiones para holders de MEXI y proveedores de liquidez
 * @dev Recibe fees de todos los productos y los distribuye proporcionalmente
 * 
 * SEGURIDAD IMPLEMENTADA:
 * - ReentrancyGuard: Protección contra ataques de reentrada
 * - Pausable: Capacidad de pausar en caso de emergencia
 * - AccessControl: Control de roles granular
 * - Snapshot: Sistema de snapshots para distribución justa
 * - Claim Deadline: Límite de tiempo para reclamar
 */

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

interface IMexiToken {
    function balanceOf(address account) external view returns (uint256);
    function totalSupply() external view returns (uint256);
}

interface IMexiLP {
    function balanceOf(address account) external view returns (uint256);
    function totalSupply() external view returns (uint256);
}

contract FeeDistributor is ReentrancyGuard, Pausable, AccessControl {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // ============ ROLES ============
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");

    // ============ CONSTANTES ============
    uint256 public constant PRECISION = 1e18;
    uint256 public constant DISTRIBUTION_INTERVAL = 1 weeks;
    uint256 public constant CLAIM_DEADLINE = 90 days; // 90 días para reclamar

    // ============ ESTRUCTURAS ============
    struct Epoch {
        uint256 id;
        uint256 startTime;
        uint256 endTime;
        uint256 totalFees;
        uint256 feesToHolders;
        uint256 feesToLPs;
        uint256 totalMexiStaked;
        uint256 totalLPStaked;
        uint256 claimedByHolders;
        uint256 claimedByLPs;
        bool finalized;
    }

    struct UserClaim {
        uint256 lastClaimedEpoch;
        uint256 totalClaimed;
    }

    // ============ ESTADO ============
    IERC20 public immutable DAI;
    IMexiToken public immutable MEXI;
    IMexiLP public mexiLP;

    mapping(uint256 => Epoch) public epochs;
    mapping(address => UserClaim) public userClaims;
    mapping(uint256 => mapping(address => uint256)) public userMexiBalanceAtEpoch;
    mapping(uint256 => mapping(address => uint256)) public userLPBalanceAtEpoch;
    mapping(uint256 => mapping(address => bool)) public hasClaimedEpoch;

    uint256 public currentEpochId;
    uint256 public totalFeesDistributed;
    uint256 public pendingFees;

    // Distribución
    uint256 public holderShare = 50; // 50%
    uint256 public lpShare = 50; // 50%

    // Productos registrados que pueden enviar fees
    mapping(address => bool) public registeredProducts;
    address[] public productList;

    // ============ EVENTOS ============
    event EpochCreated(uint256 indexed epochId, uint256 startTime, uint256 endTime);
    event EpochFinalized(uint256 indexed epochId, uint256 totalFees);
    event FeesClaimed(address indexed user, uint256 indexed epochId, uint256 amount);
    event FeesReceived(address indexed from, uint256 amount);
    event ProductRegistered(address indexed product);
    event ProductUnregistered(address indexed product);
    event SharesUpdated(uint256 holderShare, uint256 lpShare);
    event SnapshotTaken(uint256 indexed epochId, address indexed user, uint256 mexiBalance, uint256 lpBalance);

    // ============ MODIFICADORES ============
    modifier onlyRegisteredProduct() {
        require(registeredProducts[msg.sender], "FEE: Not registered product");
        _;
    }

    modifier epochExists(uint256 epochId) {
        require(epochs[epochId].startTime > 0, "FEE: Epoch not found");
        _;
    }

    // ============ CONSTRUCTOR ============
    constructor(
        address _dai,
        address _mexi
    ) {
        require(_dai != address(0), "FEE: Invalid DAI");
        require(_mexi != address(0), "FEE: Invalid MEXI");

        DAI = IERC20(_dai);
        MEXI = IMexiToken(_mexi);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(DISTRIBUTOR_ROLE, msg.sender);

        // Crear primer epoch
        _createEpoch();
    }

    // ============ FUNCIONES DE RECEPCIÓN DE FEES ============
    function receiveFees(uint256 amount) external onlyRegisteredProduct nonReentrant {
        require(amount > 0, "FEE: Zero amount");
        
        DAI.safeTransferFrom(msg.sender, address(this), amount);
        pendingFees = pendingFees.add(amount);

        emit FeesReceived(msg.sender, amount);
    }

    // Función para recibir fees directamente (para compatibilidad)
    function depositFees() external payable {
        // Convertir ETH a DAI sería necesario en producción
        // Por ahora, solo registramos el evento
    }

    // ============ FUNCIONES DE EPOCH ============
    function _createEpoch() internal {
        currentEpochId++;
        
        epochs[currentEpochId] = Epoch({
            id: currentEpochId,
            startTime: block.timestamp,
            endTime: block.timestamp.add(DISTRIBUTION_INTERVAL),
            totalFees: 0,
            feesToHolders: 0,
            feesToLPs: 0,
            totalMexiStaked: MEXI.totalSupply(),
            totalLPStaked: address(mexiLP) != address(0) ? mexiLP.totalSupply() : 0,
            claimedByHolders: 0,
            claimedByLPs: 0,
            finalized: false
        });

        emit EpochCreated(currentEpochId, block.timestamp, block.timestamp.add(DISTRIBUTION_INTERVAL));
    }

    function finalizeEpoch() external onlyRole(DISTRIBUTOR_ROLE) {
        Epoch storage epoch = epochs[currentEpochId];
        require(!epoch.finalized, "FEE: Already finalized");
        require(block.timestamp >= epoch.endTime, "FEE: Epoch not ended");

        // Asignar fees pendientes a este epoch
        epoch.totalFees = pendingFees;
        epoch.feesToHolders = pendingFees.mul(holderShare).div(100);
        epoch.feesToLPs = pendingFees.mul(lpShare).div(100);
        epoch.finalized = true;

        totalFeesDistributed = totalFeesDistributed.add(pendingFees);
        pendingFees = 0;

        emit EpochFinalized(currentEpochId, epoch.totalFees);

        // Crear nuevo epoch
        _createEpoch();
    }

    // ============ FUNCIONES DE SNAPSHOT ============
    function takeSnapshot(address user) external {
        Epoch storage epoch = epochs[currentEpochId];
        require(!epoch.finalized, "FEE: Epoch finalized");

        uint256 mexiBalance = MEXI.balanceOf(user);
        uint256 lpBalance = address(mexiLP) != address(0) ? mexiLP.balanceOf(user) : 0;

        userMexiBalanceAtEpoch[currentEpochId][user] = mexiBalance;
        userLPBalanceAtEpoch[currentEpochId][user] = lpBalance;

        emit SnapshotTaken(currentEpochId, user, mexiBalance, lpBalance);
    }

    function batchTakeSnapshot(address[] calldata users) external onlyRole(DISTRIBUTOR_ROLE) {
        for (uint256 i = 0; i < users.length; i++) {
            uint256 mexiBalance = MEXI.balanceOf(users[i]);
            uint256 lpBalance = address(mexiLP) != address(0) ? mexiLP.balanceOf(users[i]) : 0;

            userMexiBalanceAtEpoch[currentEpochId][users[i]] = mexiBalance;
            userLPBalanceAtEpoch[currentEpochId][users[i]] = lpBalance;

            emit SnapshotTaken(currentEpochId, users[i], mexiBalance, lpBalance);
        }
    }

    // ============ FUNCIONES DE CLAIM ============
    function claimFees(uint256 epochId) 
        external 
        nonReentrant 
        whenNotPaused 
        epochExists(epochId) 
    {
        Epoch storage epoch = epochs[epochId];
        require(epoch.finalized, "FEE: Epoch not finalized");
        require(!hasClaimedEpoch[epochId][msg.sender], "FEE: Already claimed");
        require(
            block.timestamp <= epoch.endTime.add(CLAIM_DEADLINE),
            "FEE: Claim deadline passed"
        );

        uint256 claimable = calculateClaimable(epochId, msg.sender);
        require(claimable > 0, "FEE: Nothing to claim");

        hasClaimedEpoch[epochId][msg.sender] = true;
        
        UserClaim storage userClaim = userClaims[msg.sender];
        userClaim.lastClaimedEpoch = epochId;
        userClaim.totalClaimed = userClaim.totalClaimed.add(claimable);

        DAI.safeTransfer(msg.sender, claimable);

        emit FeesClaimed(msg.sender, epochId, claimable);
    }

    function claimAllFees() external nonReentrant whenNotPaused {
        uint256 totalClaimable = 0;
        UserClaim storage userClaim = userClaims[msg.sender];

        for (uint256 i = userClaim.lastClaimedEpoch + 1; i <= currentEpochId; i++) {
            Epoch storage epoch = epochs[i];
            
            if (!epoch.finalized) continue;
            if (hasClaimedEpoch[i][msg.sender]) continue;
            if (block.timestamp > epoch.endTime.add(CLAIM_DEADLINE)) continue;

            uint256 claimable = calculateClaimable(i, msg.sender);
            if (claimable > 0) {
                hasClaimedEpoch[i][msg.sender] = true;
                totalClaimable = totalClaimable.add(claimable);
            }
        }

        require(totalClaimable > 0, "FEE: Nothing to claim");

        userClaim.lastClaimedEpoch = currentEpochId;
        userClaim.totalClaimed = userClaim.totalClaimed.add(totalClaimable);

        DAI.safeTransfer(msg.sender, totalClaimable);
    }

    function calculateClaimable(uint256 epochId, address user) 
        public 
        view 
        returns (uint256) 
    {
        Epoch storage epoch = epochs[epochId];
        if (!epoch.finalized) return 0;
        if (hasClaimedEpoch[epochId][user]) return 0;

        uint256 holderReward = 0;
        uint256 lpReward = 0;

        // Calcular reward como holder
        uint256 userMexi = userMexiBalanceAtEpoch[epochId][user];
        if (userMexi > 0 && epoch.totalMexiStaked > 0) {
            holderReward = epoch.feesToHolders.mul(userMexi).div(epoch.totalMexiStaked);
        }

        // Calcular reward como LP
        uint256 userLP = userLPBalanceAtEpoch[epochId][user];
        if (userLP > 0 && epoch.totalLPStaked > 0) {
            lpReward = epoch.feesToLPs.mul(userLP).div(epoch.totalLPStaked);
        }

        return holderReward.add(lpReward);
    }

    function calculatePendingRewards(address user) external view returns (uint256) {
        uint256 total = 0;
        UserClaim storage userClaim = userClaims[user];

        for (uint256 i = userClaim.lastClaimedEpoch + 1; i <= currentEpochId; i++) {
            if (!hasClaimedEpoch[i][user]) {
                total = total.add(calculateClaimable(i, user));
            }
        }

        return total;
    }

    // ============ FUNCIONES ADMIN ============
    function registerProduct(address product) external onlyRole(ADMIN_ROLE) {
        require(product != address(0), "FEE: Invalid product");
        require(!registeredProducts[product], "FEE: Already registered");

        registeredProducts[product] = true;
        productList.push(product);

        emit ProductRegistered(product);
    }

    function unregisterProduct(address product) external onlyRole(ADMIN_ROLE) {
        require(registeredProducts[product], "FEE: Not registered");
        registeredProducts[product] = false;
        emit ProductUnregistered(product);
    }

    function setMexiLP(address _mexiLP) external onlyRole(ADMIN_ROLE) {
        require(_mexiLP != address(0), "FEE: Invalid LP");
        mexiLP = IMexiLP(_mexiLP);
    }

    function setShares(uint256 _holderShare, uint256 _lpShare) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(_holderShare.add(_lpShare) == 100, "FEE: Must equal 100");
        holderShare = _holderShare;
        lpShare = _lpShare;
        emit SharesUpdated(_holderShare, _lpShare);
    }

    function recoverExpiredFees(uint256 epochId) external onlyRole(ADMIN_ROLE) {
        Epoch storage epoch = epochs[epochId];
        require(epoch.finalized, "FEE: Not finalized");
        require(
            block.timestamp > epoch.endTime.add(CLAIM_DEADLINE),
            "FEE: Deadline not passed"
        );

        uint256 unclaimed = epoch.totalFees
            .sub(epoch.claimedByHolders)
            .sub(epoch.claimedByLPs);

        if (unclaimed > 0) {
            // Mover a fees pendientes para redistribución
            pendingFees = pendingFees.add(unclaimed);
        }
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // ============ FUNCIONES VIEW ============
    function getEpoch(uint256 epochId) external view returns (Epoch memory) {
        return epochs[epochId];
    }

    function getCurrentEpoch() external view returns (Epoch memory) {
        return epochs[currentEpochId];
    }

    function getUserClaim(address user) external view returns (UserClaim memory) {
        return userClaims[user];
    }

    function getRegisteredProducts() external view returns (address[] memory) {
        return productList;
    }

    function getTimeUntilNextDistribution() external view returns (uint256) {
        Epoch storage epoch = epochs[currentEpochId];
        if (block.timestamp >= epoch.endTime) return 0;
        return epoch.endTime.sub(block.timestamp);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MexiLaunchpad
 * @author MexiSwap Team
 * @notice Plataforma de lanzamiento de ICO multi-cadena
 * @dev 0% comisión para MEXI, comisiones bajas para otros tokens
 * 
 * SEGURIDAD IMPLEMENTADA:
 * - ReentrancyGuard: Protección contra ataques de reentrada
 * - Pausable: Capacidad de pausar en caso de emergencia
 * - AccessControl: Control de roles granular
 * - Whitelist: Sistema de lista blanca
 * - Vesting: Liberación gradual de tokens
 * - KYC Integration: Soporte para verificación KYC
 * - Anti-bot: Protección contra bots
 * - Refund: Sistema de reembolso si no se alcanza soft cap
 */

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract MexiLaunchpad is ReentrancyGuard, Pausable, AccessControl {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // ============ ROLES ============
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant KYC_VERIFIER_ROLE = keccak256("KYC_VERIFIER_ROLE");

    // ============ CONSTANTES ============
    uint256 public constant PRECISION = 1e18;
    uint256 public constant MEXI_FEE = 0; // 0% para MEXI
    uint256 public constant STANDARD_FEE = 15e15; // 1.5% para otros tokens (más bajo que competencia ~3-5%)
    uint256 public constant MIN_SALE_DURATION = 1 days;
    uint256 public constant MAX_SALE_DURATION = 30 days;
    uint256 public constant ANTI_BOT_DELAY = 3; // 3 bloques de delay

    // ============ ESTRUCTURAS ============
    struct Sale {
        uint256 id;
        address creator;
        address saleToken;
        address paymentToken; // DAI
        uint256 tokenPrice; // Precio en DAI por token
        uint256 totalTokens; // Total de tokens a vender
        uint256 tokensSold;
        uint256 softCap;
        uint256 hardCap;
        uint256 minPurchase;
        uint256 maxPurchase;
        uint256 startTime;
        uint256 endTime;
        SalePhase currentPhase;
        SaleStatus status;
        bool isWhitelistOnly;
        bytes32 whitelistMerkleRoot;
        bool requiresKYC;
        uint256 vestingDuration;
        uint256 vestingCliff;
        uint256 tgePercent; // % liberado en TGE
    }

    enum SalePhase {
        Pending,
        PrivateSale,
        Presale,
        PublicSale,
        Ended
    }

    enum SaleStatus {
        Active,
        Successful,
        Failed,
        Cancelled
    }

    struct Participation {
        uint256 amount; // DAI invertido
        uint256 tokens; // Tokens comprados
        uint256 claimed; // Tokens reclamados
        uint256 lastClaimTime;
        bool refunded;
    }

    struct VestingSchedule {
        uint256 totalAmount;
        uint256 releasedAmount;
        uint256 startTime;
        uint256 cliff;
        uint256 duration;
        uint256 tgeAmount;
    }

    // ============ ESTADO ============
    IERC20 public immutable DAI;
    IERC20 public immutable MEXI;

    mapping(uint256 => Sale) public sales;
    mapping(uint256 => mapping(address => Participation)) public participations;
    mapping(uint256 => mapping(address => VestingSchedule)) public vestingSchedules;
    mapping(address => bool) public isKYCVerified;
    mapping(uint256 => mapping(address => uint256)) public lastPurchaseBlock;
    
    uint256 public nextSaleId = 1;
    uint256 public totalFeesCollected;
    
    // Distribución de fees
    address public feeDistributor;
    uint256 public feeToHolders = 50; // 50%
    uint256 public feeToLPs = 50; // 50%

    // ============ EVENTOS ============
    event SaleCreated(
        uint256 indexed saleId,
        address indexed creator,
        address saleToken,
        uint256 totalTokens,
        uint256 tokenPrice
    );
    event TokensPurchased(
        uint256 indexed saleId,
        address indexed buyer,
        uint256 amount,
        uint256 tokens
    );
    event TokensClaimed(
        uint256 indexed saleId,
        address indexed user,
        uint256 amount
    );
    event Refunded(
        uint256 indexed saleId,
        address indexed user,
        uint256 amount
    );
    event SaleStatusChanged(uint256 indexed saleId, SaleStatus status);
    event SalePhaseChanged(uint256 indexed saleId, SalePhase phase);
    event KYCVerified(address indexed user);
    event FeesDistributed(uint256 toHolders, uint256 toLPs);
    event WhitelistUpdated(uint256 indexed saleId, bytes32 merkleRoot);

    // ============ MODIFICADORES ============
    modifier saleExists(uint256 saleId) {
        require(sales[saleId].creator != address(0), "LAUNCH: Sale not found");
        _;
    }

    modifier saleActive(uint256 saleId) {
        Sale storage sale = sales[saleId];
        require(sale.status == SaleStatus.Active, "LAUNCH: Sale not active");
        require(block.timestamp >= sale.startTime, "LAUNCH: Sale not started");
        require(block.timestamp <= sale.endTime, "LAUNCH: Sale ended");
        _;
    }

    modifier antiBot(uint256 saleId) {
        require(
            block.number > lastPurchaseBlock[saleId][msg.sender] + ANTI_BOT_DELAY,
            "LAUNCH: Anti-bot protection"
        );
        _;
    }

    // ============ CONSTRUCTOR ============
    constructor(
        address _dai,
        address _mexi,
        address _feeDistributor
    ) {
        require(_dai != address(0), "LAUNCH: Invalid DAI");
        require(_mexi != address(0), "LAUNCH: Invalid MEXI");
        require(_feeDistributor != address(0), "LAUNCH: Invalid fee distributor");

        DAI = IERC20(_dai);
        MEXI = IERC20(_mexi);
        feeDistributor = _feeDistributor;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        _grantRole(KYC_VERIFIER_ROLE, msg.sender);
    }

    // ============ FUNCIONES DE CREACIÓN DE VENTA ============
    function createSale(
        address saleToken,
        uint256 tokenPrice,
        uint256 totalTokens,
        uint256 softCap,
        uint256 hardCap,
        uint256 minPurchase,
        uint256 maxPurchase,
        uint256 startTime,
        uint256 endTime,
        bool isWhitelistOnly,
        bool requiresKYC,
        uint256 vestingDuration,
        uint256 vestingCliff,
        uint256 tgePercent
    ) external nonReentrant whenNotPaused returns (uint256) {
        // Validaciones
        require(saleToken != address(0), "LAUNCH: Invalid token");
        require(tokenPrice > 0, "LAUNCH: Invalid price");
        require(totalTokens > 0, "LAUNCH: Invalid total");
        require(softCap > 0 && softCap <= hardCap, "LAUNCH: Invalid caps");
        require(minPurchase > 0 && minPurchase <= maxPurchase, "LAUNCH: Invalid limits");
        require(startTime > block.timestamp, "LAUNCH: Invalid start");
        require(endTime > startTime, "LAUNCH: Invalid end");
        require(endTime.sub(startTime) >= MIN_SALE_DURATION, "LAUNCH: Duration too short");
        require(endTime.sub(startTime) <= MAX_SALE_DURATION, "LAUNCH: Duration too long");
        require(tgePercent <= 100, "LAUNCH: Invalid TGE percent");

        // Transferir tokens al contrato
        IERC20(saleToken).safeTransferFrom(msg.sender, address(this), totalTokens);

        // Crear venta
        uint256 saleId = nextSaleId++;
        sales[saleId] = Sale({
            id: saleId,
            creator: msg.sender,
            saleToken: saleToken,
            paymentToken: address(DAI),
            tokenPrice: tokenPrice,
            totalTokens: totalTokens,
            tokensSold: 0,
            softCap: softCap,
            hardCap: hardCap,
            minPurchase: minPurchase,
            maxPurchase: maxPurchase,
            startTime: startTime,
            endTime: endTime,
            currentPhase: SalePhase.Pending,
            status: SaleStatus.Active,
            isWhitelistOnly: isWhitelistOnly,
            whitelistMerkleRoot: bytes32(0),
            requiresKYC: requiresKYC,
            vestingDuration: vestingDuration,
            vestingCliff: vestingCliff,
            tgePercent: tgePercent
        });

        emit SaleCreated(saleId, msg.sender, saleToken, totalTokens, tokenPrice);
        return saleId;
    }

    // ============ FUNCIONES DE COMPRA ============
    function buyTokens(
        uint256 saleId,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) external nonReentrant whenNotPaused saleExists(saleId) saleActive(saleId) antiBot(saleId) {
        Sale storage sale = sales[saleId];
        
        // Verificar whitelist si es necesario
        if (sale.isWhitelistOnly) {
            require(
                _verifyWhitelist(saleId, msg.sender, merkleProof),
                "LAUNCH: Not whitelisted"
            );
        }

        // Verificar KYC si es necesario
        if (sale.requiresKYC) {
            require(isKYCVerified[msg.sender], "LAUNCH: KYC required");
        }

        // Validar cantidad
        Participation storage participation = participations[saleId][msg.sender];
        uint256 newTotal = participation.amount.add(amount);
        
        require(amount >= sale.minPurchase, "LAUNCH: Below minimum");
        require(newTotal <= sale.maxPurchase, "LAUNCH: Exceeds maximum");

        // Calcular tokens
        uint256 tokensToReceive = amount.mul(PRECISION).div(sale.tokenPrice);
        require(
            sale.tokensSold.add(tokensToReceive) <= sale.totalTokens,
            "LAUNCH: Exceeds available"
        );

        // Verificar hard cap
        uint256 totalRaised = sale.tokensSold.mul(sale.tokenPrice).div(PRECISION);
        require(totalRaised.add(amount) <= sale.hardCap, "LAUNCH: Hard cap reached");

        // Calcular fee
        uint256 fee = _calculateFee(sale.saleToken, amount);
        uint256 netAmount = amount.sub(fee);

        // Transferir DAI
        DAI.safeTransferFrom(msg.sender, address(this), amount);

        // Actualizar participación
        participation.amount = newTotal;
        participation.tokens = participation.tokens.add(tokensToReceive);
        sale.tokensSold = sale.tokensSold.add(tokensToReceive);

        // Registrar bloque para anti-bot
        lastPurchaseBlock[saleId][msg.sender] = block.number;

        // Distribuir fee
        if (fee > 0) {
            _distributeFees(fee);
            totalFeesCollected = totalFeesCollected.add(fee);
        }

        // Transferir net amount al creador
        DAI.safeTransfer(sale.creator, netAmount);

        // Crear vesting schedule si hay vesting
        if (sale.vestingDuration > 0) {
            _createVestingSchedule(saleId, msg.sender, tokensToReceive, sale);
        }

        emit TokensPurchased(saleId, msg.sender, amount, tokensToReceive);
    }

    // ============ FUNCIONES DE CLAIM ============
    function claimTokens(uint256 saleId) 
        external 
        nonReentrant 
        saleExists(saleId) 
    {
        Sale storage sale = sales[saleId];
        require(
            sale.status == SaleStatus.Successful || block.timestamp > sale.endTime,
            "LAUNCH: Sale not ended"
        );

        Participation storage participation = participations[saleId][msg.sender];
        require(participation.tokens > 0, "LAUNCH: No tokens to claim");
        require(!participation.refunded, "LAUNCH: Already refunded");

        uint256 claimable;

        if (sale.vestingDuration > 0) {
            // Claim con vesting
            claimable = _calculateVestedAmount(saleId, msg.sender);
        } else {
            // Claim sin vesting
            claimable = participation.tokens.sub(participation.claimed);
        }

        require(claimable > 0, "LAUNCH: Nothing to claim");

        participation.claimed = participation.claimed.add(claimable);
        participation.lastClaimTime = block.timestamp;

        IERC20(sale.saleToken).safeTransfer(msg.sender, claimable);

        emit TokensClaimed(saleId, msg.sender, claimable);
    }

    // ============ FUNCIONES DE REFUND ============
    function claimRefund(uint256 saleId) 
        external 
        nonReentrant 
        saleExists(saleId) 
    {
        Sale storage sale = sales[saleId];
        require(block.timestamp > sale.endTime, "LAUNCH: Sale not ended");
        
        // Verificar si no se alcanzó soft cap
        uint256 totalRaised = sale.tokensSold.mul(sale.tokenPrice).div(PRECISION);
        require(totalRaised < sale.softCap, "LAUNCH: Soft cap reached");

        Participation storage participation = participations[saleId][msg.sender];
        require(participation.amount > 0, "LAUNCH: No participation");
        require(!participation.refunded, "LAUNCH: Already refunded");

        uint256 refundAmount = participation.amount;
        participation.refunded = true;

        // Marcar venta como fallida
        if (sale.status != SaleStatus.Failed) {
            sale.status = SaleStatus.Failed;
            emit SaleStatusChanged(saleId, SaleStatus.Failed);
        }

        DAI.safeTransfer(msg.sender, refundAmount);

        emit Refunded(saleId, msg.sender, refundAmount);
    }

    // ============ FUNCIONES DE VESTING ============
    function _createVestingSchedule(
        uint256 saleId,
        address user,
        uint256 amount,
        Sale storage sale
    ) internal {
        uint256 tgeAmount = amount.mul(sale.tgePercent).div(100);
        
        vestingSchedules[saleId][user] = VestingSchedule({
            totalAmount: amount,
            releasedAmount: 0,
            startTime: sale.endTime,
            cliff: sale.vestingCliff,
            duration: sale.vestingDuration,
            tgeAmount: tgeAmount
        });
    }

    function _calculateVestedAmount(uint256 saleId, address user) 
        internal 
        view 
        returns (uint256) 
    {
        VestingSchedule storage schedule = vestingSchedules[saleId][user];
        
        if (block.timestamp < schedule.startTime) {
            return 0;
        }

        // TGE amount disponible inmediatamente
        uint256 available = schedule.tgeAmount;

        // Calcular vesting lineal después del cliff
        if (block.timestamp >= schedule.startTime.add(schedule.cliff)) {
            uint256 vestingAmount = schedule.totalAmount.sub(schedule.tgeAmount);
            uint256 elapsed = block.timestamp.sub(schedule.startTime.add(schedule.cliff));
            
            if (elapsed >= schedule.duration) {
                available = schedule.totalAmount;
            } else {
                uint256 vested = vestingAmount.mul(elapsed).div(schedule.duration);
                available = schedule.tgeAmount.add(vested);
            }
        }

        return available.sub(schedule.releasedAmount);
    }

    // ============ FUNCIONES DE FEE ============
    function _calculateFee(address saleToken, uint256 amount) 
        internal 
        view 
        returns (uint256) 
    {
        // 0% fee para MEXI
        if (saleToken == address(MEXI)) {
            return 0;
        }
        
        // 1.5% para otros tokens
        return amount.mul(STANDARD_FEE).div(PRECISION);
    }

    function _distributeFees(uint256 fee) internal {
        uint256 toHolders = fee.mul(feeToHolders).div(100);
        uint256 toLPs = fee.mul(feeToLPs).div(100);

        if (toHolders.add(toLPs) > 0) {
            DAI.safeTransfer(feeDistributor, toHolders.add(toLPs));
            emit FeesDistributed(toHolders, toLPs);
        }
    }

    // ============ FUNCIONES DE WHITELIST ============
    function setWhitelistMerkleRoot(uint256 saleId, bytes32 merkleRoot) 
        external 
        saleExists(saleId) 
    {
        require(
            sales[saleId].creator == msg.sender || hasRole(ADMIN_ROLE, msg.sender),
            "LAUNCH: Not authorized"
        );
        
        sales[saleId].whitelistMerkleRoot = merkleRoot;
        emit WhitelistUpdated(saleId, merkleRoot);
    }

    function _verifyWhitelist(
        uint256 saleId,
        address user,
        bytes32[] calldata merkleProof
    ) internal view returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(user));
        return MerkleProof.verify(merkleProof, sales[saleId].whitelistMerkleRoot, leaf);
    }

    // ============ FUNCIONES DE KYC ============
    function setKYCStatus(address user, bool status) 
        external 
        onlyRole(KYC_VERIFIER_ROLE) 
    {
        isKYCVerified[user] = status;
        if (status) {
            emit KYCVerified(user);
        }
    }

    function batchSetKYCStatus(address[] calldata users, bool status) 
        external 
        onlyRole(KYC_VERIFIER_ROLE) 
    {
        for (uint256 i = 0; i < users.length; i++) {
            isKYCVerified[users[i]] = status;
            if (status) {
                emit KYCVerified(users[i]);
            }
        }
    }

    // ============ FUNCIONES ADMIN ============
    function setSalePhase(uint256 saleId, SalePhase phase) 
        external 
        onlyRole(OPERATOR_ROLE) 
        saleExists(saleId) 
    {
        sales[saleId].currentPhase = phase;
        emit SalePhaseChanged(saleId, phase);
    }

    function finalizeSale(uint256 saleId) 
        external 
        onlyRole(OPERATOR_ROLE) 
        saleExists(saleId) 
    {
        Sale storage sale = sales[saleId];
        require(block.timestamp > sale.endTime, "LAUNCH: Sale not ended");
        require(sale.status == SaleStatus.Active, "LAUNCH: Already finalized");

        uint256 totalRaised = sale.tokensSold.mul(sale.tokenPrice).div(PRECISION);
        
        if (totalRaised >= sale.softCap) {
            sale.status = SaleStatus.Successful;
            
            // Devolver tokens no vendidos al creador
            uint256 unsoldTokens = sale.totalTokens.sub(sale.tokensSold);
            if (unsoldTokens > 0) {
                IERC20(sale.saleToken).safeTransfer(sale.creator, unsoldTokens);
            }
        } else {
            sale.status = SaleStatus.Failed;
        }

        emit SaleStatusChanged(saleId, sale.status);
    }

    function cancelSale(uint256 saleId) 
        external 
        saleExists(saleId) 
    {
        Sale storage sale = sales[saleId];
        require(
            sale.creator == msg.sender || hasRole(ADMIN_ROLE, msg.sender),
            "LAUNCH: Not authorized"
        );
        require(sale.status == SaleStatus.Active, "LAUNCH: Not active");
        require(sale.tokensSold == 0, "LAUNCH: Tokens already sold");

        sale.status = SaleStatus.Cancelled;
        
        // Devolver tokens al creador
        IERC20(sale.saleToken).safeTransfer(sale.creator, sale.totalTokens);

        emit SaleStatusChanged(saleId, SaleStatus.Cancelled);
    }

    function setFeeDistribution(uint256 _feeToHolders, uint256 _feeToLPs) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(_feeToHolders.add(_feeToLPs) == 100, "LAUNCH: Must equal 100");
        feeToHolders = _feeToHolders;
        feeToLPs = _feeToLPs;
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // ============ FUNCIONES VIEW ============
    function getSaleInfo(uint256 saleId) external view returns (Sale memory) {
        return sales[saleId];
    }

    function getParticipation(uint256 saleId, address user) 
        external 
        view 
        returns (Participation memory) 
    {
        return participations[saleId][user];
    }

    function getVestingSchedule(uint256 saleId, address user) 
        external 
        view 
        returns (VestingSchedule memory) 
    {
        return vestingSchedules[saleId][user];
    }

    function getClaimableAmount(uint256 saleId, address user) 
        external 
        view 
        returns (uint256) 
    {
        Sale storage sale = sales[saleId];
        
        if (sale.vestingDuration > 0) {
            return _calculateVestedAmount(saleId, user);
        } else {
            Participation storage participation = participations[saleId][user];
            return participation.tokens.sub(participation.claimed);
        }
    }

    function getTotalRaised(uint256 saleId) external view returns (uint256) {
        Sale storage sale = sales[saleId];
        return sale.tokensSold.mul(sale.tokenPrice).div(PRECISION);
    }
}

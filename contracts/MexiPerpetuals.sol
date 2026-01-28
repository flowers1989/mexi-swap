// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MexiPerpetuals
 * @author MexiSwap Team
 * @notice Trading de perpetuos con apalancamiento hasta 100x
 * @dev Colateral en DAI, multi-cadena, seguridad extrema
 * 
 * SEGURIDAD IMPLEMENTADA:
 * - ReentrancyGuard: Protección contra ataques de reentrada
 * - Pausable: Capacidad de pausar en caso de emergencia
 * - AccessControl: Control de roles granular
 * - Price Oracle: Chainlink para precios seguros
 * - Liquidation Engine: Motor de liquidación automático
 * - Circuit Breaker: Detiene operaciones en movimientos extremos
 * - Position Limits: Límites por posición y por usuario
 */

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./PythPriceOracle.sol";

contract MexiPerpetuals is ReentrancyGuard, Pausable, AccessControl {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // ============ ROLES ============
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant LIQUIDATOR_ROLE = keccak256("LIQUIDATOR_ROLE");
    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    PythPriceOracle public priceOracle;

    // ============ CONSTANTES ============
    uint256 public constant PRECISION = 1e18;
    uint256 public constant MAX_LEVERAGE = 100; // 100x
    uint256 public constant MIN_LEVERAGE = 1;
    uint256 public constant MAINTENANCE_MARGIN = 5e16; // 5%
    uint256 public constant LIQUIDATION_FEE = 5e15; // 0.5%
    uint256 public constant TRADING_FEE = 3e14; // 0.03% (Más competitivo que GMX V2)
    uint256 public constant FUNDING_INTERVAL = 1 hours;
    uint256 public constant MAX_FUNDING_RATE = 1e16; // 1% max funding rate

    // Circuit breaker
    uint256 public constant CIRCUIT_BREAKER_THRESHOLD = 10e16; // 10% movimiento
    uint256 public constant CIRCUIT_BREAKER_DURATION = 1 hours;

    // ============ ESTRUCTURAS ============
    struct Position {
        uint256 id;
        address trader;
        bytes32 asset;
        bool isLong;
        uint256 collateral;
        uint256 size;
        uint256 leverage;
        uint256 entryPrice;
        uint256 liquidationPrice;
        int256 fundingAccrued;
        uint256 lastFundingTime;
        uint256 openTime;
        PositionStatus status;
    }

    enum PositionStatus {
        Active,
        Liquidated,
        Closed
    }

    struct Market {
        bytes32 asset;
        address priceFeed;
        uint256 maxOpenInterest;
        uint256 longOpenInterest;
        uint256 shortOpenInterest;
        int256 fundingRate;
        uint256 lastFundingUpdate;
        bool isActive;
    }

    struct CircuitBreaker {
        uint256 lastPrice;
        uint256 triggerTime;
        bool isTriggered;
    }

    // ============ ESTADO ============
    IERC20 public immutable DAI;
    IERC20 public immutable MEXI;

    mapping(uint256 => Position) public positions;
    mapping(address => uint256[]) public userPositions;
    mapping(bytes32 => Market) public markets;
    mapping(bytes32 => CircuitBreaker) public circuitBreakers;
    
    bytes32[] public activeMarkets;
    uint256 public nextPositionId = 1;
    uint256 public totalCollateral;
    uint256 public insuranceFund;

    // Límites de seguridad
    uint256 public maxPositionSize = 1_000_000 * PRECISION; // $1M max
    uint256 public maxUserPositions = 10;
    uint256 public minCollateral = 10 * PRECISION; // $10 min

    // Distribución de fees
    uint256 public feeToHolders = 50; // 50%
    uint256 public feeToLPs = 50; // 50%
    address public feeDistributor;

    // ============ EVENTOS ============
    event PositionOpened(
        uint256 indexed positionId,
        address indexed trader,
        bytes32 asset,
        bool isLong,
        uint256 collateral,
        uint256 size,
        uint256 leverage,
        uint256 entryPrice
    );
    event PositionClosed(
        uint256 indexed positionId,
        address indexed trader,
        int256 pnl,
        uint256 exitPrice
    );
    event PositionLiquidated(
        uint256 indexed positionId,
        address indexed trader,
        address indexed liquidator,
        uint256 liquidationPrice
    );
    event CollateralAdded(uint256 indexed positionId, uint256 amount);
    event CollateralRemoved(uint256 indexed positionId, uint256 amount);
    event FundingPaid(uint256 indexed positionId, int256 amount);
    event MarketAdded(bytes32 asset, address priceFeed);
    event CircuitBreakerTriggered(bytes32 asset, uint256 price);
    event CircuitBreakerReset(bytes32 asset);
    event FeesDistributed(uint256 toHolders, uint256 toLPs);

    // ============ MODIFICADORES ============
    modifier marketActive(string memory asset) {
        require(markets[asset].isActive, "PERP: Market not active");
        require(!circuitBreakers[asset].isTriggered, "PERP: Circuit breaker active");
        _;
    }

    modifier positionExists(uint256 positionId) {
        require(positions[positionId].trader != address(0), "PERP: Position not found");
        _;
    }

    modifier onlyPositionOwner(uint256 positionId) {
        require(positions[positionId].trader == msg.sender, "PERP: Not position owner");
        _;
    }

    // ============ CONSTRUCTOR ============
    constructor(
        address _dai,
        address _mexi,
        address _feeDistributor
    ) {
        require(_dai != address(0), "PERP: Invalid DAI address");
        require(_mexi != address(0), "PERP: Invalid MEXI address");
        require(_feeDistributor != address(0), "PERP: Invalid fee distributor");

        DAI = IERC20(_dai);
        MEXI = IERC20(_mexi);
        feeDistributor = _feeDistributor;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(LIQUIDATOR_ROLE, msg.sender);
        _grantRole(KEEPER_ROLE, msg.sender);
    }

    // ============ FUNCIONES DE TRADING ============
    function openPosition(
        string calldata asset,
        bool isLong,
        uint256 collateral,
        uint256 leverage
    ) external nonReentrant whenNotPaused marketActive(asset) returns (uint256) {
        // Validaciones
        require(collateral >= minCollateral, "PERP: Collateral too low");
        require(leverage >= MIN_LEVERAGE && leverage <= MAX_LEVERAGE, "PERP: Invalid leverage");
        require(userPositions[msg.sender].length < maxUserPositions, "PERP: Max positions reached");

        uint256 size = collateral.mul(leverage);
        require(size <= maxPositionSize, "PERP: Position too large");

        // Obtener precio actual
        uint256 currentPrice = getPrice(asset);
        require(currentPrice > 0, "PERP: Invalid price");

        // Verificar open interest
        Market storage market = markets[asset];
        if (isLong) {
            require(
                market.longOpenInterest.add(size) <= market.maxOpenInterest,
                "PERP: Max long OI reached"
            );
            market.longOpenInterest = market.longOpenInterest.add(size);
        } else {
            require(
                market.shortOpenInterest.add(size) <= market.maxOpenInterest,
                "PERP: Max short OI reached"
            );
            market.shortOpenInterest = market.shortOpenInterest.add(size);
        }

        // Calcular precio de liquidación
        uint256 liquidationPrice = calculateLiquidationPrice(
            currentPrice,
            leverage,
            isLong
        );

        // Calcular y cobrar fee
        uint256 fee = size.mul(TRADING_FEE).div(PRECISION);
        uint256 totalRequired = collateral.add(fee);

        // Transferir DAI
        DAI.safeTransferFrom(msg.sender, address(this), totalRequired);
        
        // Distribuir fee
        _distributeFees(fee);

        // Crear posición
        uint256 positionId = nextPositionId++;
        positions[positionId] = Position({
            id: positionId,
            trader: msg.sender,
            asset: asset,
            isLong: isLong,
            collateral: collateral,
            size: size,
            leverage: leverage,
            entryPrice: currentPrice,
            liquidationPrice: liquidationPrice,
            fundingAccrued: 0,
            lastFundingTime: block.timestamp,
            openTime: block.timestamp,
            status: PositionStatus.Active
        });

        userPositions[msg.sender].push(positionId);
        totalCollateral = totalCollateral.add(collateral);

        emit PositionOpened(
            positionId,
            msg.sender,
            asset,
            isLong,
            collateral,
            size,
            leverage,
            currentPrice
        );

        return positionId;
    }

    function closePosition(uint256 positionId) 
        external 
        nonReentrant 
        whenNotPaused 
        positionExists(positionId)
        onlyPositionOwner(positionId)
    {
        Position storage position = positions[positionId];
        require(position.status == PositionStatus.Active, "PERP: Position not active");

        uint256 currentPrice = getPrice(position.asset);
        
        // Calcular PnL
        int256 pnl = calculatePnL(positionId, currentPrice);
        
        // Actualizar funding
        _updateFunding(positionId);
        pnl = pnl + position.fundingAccrued;

        // Calcular fee de cierre
        uint256 closeFee = position.size.mul(TRADING_FEE).div(PRECISION);
        
        // Calcular monto a devolver
        int256 returnAmount = int256(position.collateral) + pnl - int256(closeFee);
        
        // Actualizar open interest
        Market storage market = markets[position.asset];
        if (position.isLong) {
            market.longOpenInterest = market.longOpenInterest.sub(position.size);
        } else {
            market.shortOpenInterest = market.shortOpenInterest.sub(position.size);
        }

        // Cerrar posición
        position.status = PositionStatus.Closed;
        totalCollateral = totalCollateral.sub(position.collateral);

        // Distribuir fee
        _distributeFees(closeFee);

        // Transferir fondos
        if (returnAmount > 0) {
            DAI.safeTransfer(msg.sender, uint256(returnAmount));
        } else if (returnAmount < 0) {
            // Pérdida va al insurance fund
            uint256 loss = uint256(-returnAmount);
            if (loss > position.collateral) {
                insuranceFund = insuranceFund.add(position.collateral);
            }
        }

        emit PositionClosed(positionId, msg.sender, pnl, currentPrice);
    }

    function liquidatePosition(uint256 positionId) 
        external 
        nonReentrant 
        positionExists(positionId)
    {
        Position storage position = positions[positionId];
        require(position.status == PositionStatus.Active, "PERP: Position not active");

        uint256 currentPrice = getPrice(position.asset);
        
        // Verificar si es liquidable
        require(
            _isLiquidatable(positionId, currentPrice),
            "PERP: Position not liquidatable"
        );

        // Calcular recompensa del liquidador
        uint256 liquidatorReward = position.collateral.mul(LIQUIDATION_FEE).div(PRECISION);
        uint256 remainingCollateral = position.collateral.sub(liquidatorReward);

        // Actualizar open interest
        Market storage market = markets[position.asset];
        if (position.isLong) {
            market.longOpenInterest = market.longOpenInterest.sub(position.size);
        } else {
            market.shortOpenInterest = market.shortOpenInterest.sub(position.size);
        }

        // Liquidar posición
        position.status = PositionStatus.Liquidated;
        totalCollateral = totalCollateral.sub(position.collateral);

        // Transferir recompensa al liquidador
        DAI.safeTransfer(msg.sender, liquidatorReward);
        
        // Resto al insurance fund
        insuranceFund = insuranceFund.add(remainingCollateral);

        emit PositionLiquidated(positionId, position.trader, msg.sender, currentPrice);
    }

    // ============ FUNCIONES DE COLATERAL ============
    function addCollateral(uint256 positionId, uint256 amount) 
        external 
        nonReentrant 
        positionExists(positionId)
        onlyPositionOwner(positionId)
    {
        Position storage position = positions[positionId];
        require(position.status == PositionStatus.Active, "PERP: Position not active");

        DAI.safeTransferFrom(msg.sender, address(this), amount);
        
        position.collateral = position.collateral.add(amount);
        position.leverage = position.size.div(position.collateral);
        position.liquidationPrice = calculateLiquidationPrice(
            position.entryPrice,
            position.leverage,
            position.isLong
        );
        
        totalCollateral = totalCollateral.add(amount);

        emit CollateralAdded(positionId, amount);
    }

    function removeCollateral(uint256 positionId, uint256 amount) 
        external 
        nonReentrant 
        positionExists(positionId)
        onlyPositionOwner(positionId)
    {
        Position storage position = positions[positionId];
        require(position.status == PositionStatus.Active, "PERP: Position not active");
        
        uint256 newCollateral = position.collateral.sub(amount);
        require(newCollateral >= minCollateral, "PERP: Collateral too low");
        
        uint256 newLeverage = position.size.div(newCollateral);
        require(newLeverage <= MAX_LEVERAGE, "PERP: Leverage too high");

        // Verificar que no sea liquidable después de remover
        uint256 currentPrice = getPrice(position.asset);
        uint256 newLiquidationPrice = calculateLiquidationPrice(
            position.entryPrice,
            newLeverage,
            position.isLong
        );
        
        if (position.isLong) {
            require(currentPrice > newLiquidationPrice, "PERP: Would be liquidatable");
        } else {
            require(currentPrice < newLiquidationPrice, "PERP: Would be liquidatable");
        }

        position.collateral = newCollateral;
        position.leverage = newLeverage;
        position.liquidationPrice = newLiquidationPrice;
        
        totalCollateral = totalCollateral.sub(amount);
        DAI.safeTransfer(msg.sender, amount);

        emit CollateralRemoved(positionId, amount);
    }

    // ============ FUNCIONES DE PRECIO ============
    function getPrice(string memory asset) public view returns (uint256) {
        Market storage market = markets[asset];
        require(market.priceFeed != address(0), "PERP: No price feed");

        AggregatorV3Interface priceFeed = AggregatorV3Interface(market.priceFeed);
        
        (
            uint80 roundId,
            int256 price,
            ,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();

        // Validaciones de seguridad del oracle
        require(price > 0, "PERP: Invalid price");
        require(updatedAt > 0, "PERP: Stale price");
        require(answeredInRound >= roundId, "PERP: Stale round");
        require(block.timestamp - updatedAt < 1 hours, "PERP: Price too old");

        return uint256(price).mul(PRECISION).div(10**priceFeed.decimals());
    }

    // ============ FUNCIONES DE CÁLCULO ============
    function calculateLiquidationPrice(
        uint256 entryPrice,
        uint256 leverage,
        bool isLong
    ) public pure returns (uint256) {
        uint256 marginRatio = PRECISION.div(leverage);
        uint256 liquidationThreshold = marginRatio.sub(MAINTENANCE_MARGIN);

        if (isLong) {
            return entryPrice.mul(PRECISION.sub(liquidationThreshold)).div(PRECISION);
        } else {
            return entryPrice.mul(PRECISION.add(liquidationThreshold)).div(PRECISION);
        }
    }

    function calculatePnL(uint256 positionId, uint256 currentPrice) 
        public 
        view 
        returns (int256) 
    {
        Position storage position = positions[positionId];
        
        int256 priceDiff = int256(currentPrice) - int256(position.entryPrice);
        int256 direction = position.isLong ? int256(1) : int256(-1);
        
        return priceDiff.mul(int256(position.size)).mul(direction).div(int256(position.entryPrice));
    }

    function _isLiquidatable(uint256 positionId, uint256 currentPrice) 
        internal 
        view 
        returns (bool) 
    {
        Position storage position = positions[positionId];
        
        if (position.isLong) {
            return currentPrice <= position.liquidationPrice;
        } else {
            return currentPrice >= position.liquidationPrice;
        }
    }

    // ============ FUNCIONES DE FUNDING ============
    function _updateFunding(uint256 positionId) internal {
        Position storage position = positions[positionId];
        Market storage market = markets[position.asset];

        uint256 timePassed = block.timestamp.sub(position.lastFundingTime);
        uint256 intervals = timePassed.div(FUNDING_INTERVAL);

        if (intervals > 0) {
            int256 fundingPayment = int256(position.size)
                .mul(market.fundingRate)
                .mul(int256(intervals))
                .div(int256(PRECISION));

            if (position.isLong) {
                position.fundingAccrued = position.fundingAccrued - fundingPayment;
            } else {
                position.fundingAccrued = position.fundingAccrued + fundingPayment;
            }

            position.lastFundingTime = block.timestamp;
            emit FundingPaid(positionId, fundingPayment);
        }
    }

    function updateMarketFunding(string calldata asset) external onlyRole(KEEPER_ROLE) {
        Market storage market = markets[asset];
        require(market.isActive, "PERP: Market not active");

        uint256 timePassed = block.timestamp.sub(market.lastFundingUpdate);
        require(timePassed >= FUNDING_INTERVAL, "PERP: Too early");

        // Calcular funding rate basado en OI imbalance
        int256 oiDiff = int256(market.longOpenInterest) - int256(market.shortOpenInterest);
        int256 totalOI = int256(market.longOpenInterest.add(market.shortOpenInterest));

        if (totalOI > 0) {
            market.fundingRate = oiDiff.mul(int256(MAX_FUNDING_RATE)).div(totalOI);
        } else {
            market.fundingRate = 0;
        }

        market.lastFundingUpdate = block.timestamp;
    }

    // ============ FUNCIONES DE DISTRIBUCIÓN DE FEES ============
    function _distributeFees(uint256 fee) internal {
        uint256 toHolders = fee.mul(feeToHolders).div(100);
        uint256 toLPs = fee.mul(feeToLPs).div(100);

        // Transferir al distribuidor de fees
        if (toHolders.add(toLPs) > 0) {
            DAI.safeTransfer(feeDistributor, toHolders.add(toLPs));
            emit FeesDistributed(toHolders, toLPs);
        }
    }

    // ============ FUNCIONES DE CIRCUIT BREAKER ============
    function checkCircuitBreaker(string calldata asset) external {
        uint256 currentPrice = getPrice(asset);
        CircuitBreaker storage cb = circuitBreakers[asset];

        if (cb.lastPrice > 0) {
            uint256 priceChange;
            if (currentPrice > cb.lastPrice) {
                priceChange = currentPrice.sub(cb.lastPrice).mul(PRECISION).div(cb.lastPrice);
            } else {
                priceChange = cb.lastPrice.sub(currentPrice).mul(PRECISION).div(cb.lastPrice);
            }

            if (priceChange >= CIRCUIT_BREAKER_THRESHOLD) {
                cb.isTriggered = true;
                cb.triggerTime = block.timestamp;
                emit CircuitBreakerTriggered(asset, currentPrice);
            }
        }

        cb.lastPrice = currentPrice;
    }

    function resetCircuitBreaker(string calldata asset) external onlyRole(ADMIN_ROLE) {
        CircuitBreaker storage cb = circuitBreakers[asset];
        require(cb.isTriggered, "PERP: Not triggered");
        require(
            block.timestamp >= cb.triggerTime.add(CIRCUIT_BREAKER_DURATION),
            "PERP: Duration not passed"
        );

        cb.isTriggered = false;
        emit CircuitBreakerReset(asset);
    }

    // ============ FUNCIONES ADMIN ============
    function addMarket(
        string calldata asset,
        address priceFeed,
        uint256 maxOI
    ) external onlyRole(ADMIN_ROLE) {
        require(markets[asset].priceFeed == address(0), "PERP: Market exists");
        require(priceFeed != address(0), "PERP: Invalid price feed");

        markets[asset] = Market({
            asset: asset,
            priceFeed: priceFeed,
            maxOpenInterest: maxOI,
            longOpenInterest: 0,
            shortOpenInterest: 0,
            fundingRate: 0,
            lastFundingUpdate: block.timestamp,
            isActive: true
        });

        activeMarkets.push(asset);
        emit MarketAdded(asset, priceFeed);
    }

    function setMarketActive(string calldata asset, bool active) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        markets[asset].isActive = active;
    }

    function setFeeDistribution(uint256 _feeToHolders, uint256 _feeToLPs) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(_feeToHolders.add(_feeToLPs) == 100, "PERP: Must equal 100");
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
    function getUserPositions(address user) external view returns (uint256[] memory) {
        return userPositions[user];
    }

    function getActiveMarkets() external view returns (string[] memory) {
        return activeMarkets;
    }

    function getMarketInfo(string calldata asset) external view returns (Market memory) {
        return markets[asset];
    }
}

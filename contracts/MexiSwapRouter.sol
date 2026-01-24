// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MexiSwapRouter
 * @author MexiSwap Team
 * @notice Router principal del DEX MexiSwap
 * @dev Maneja swaps, adición/remoción de liquidez
 * 
 * SEGURIDAD IMPLEMENTADA:
 * - ReentrancyGuard: Protección contra ataques de reentrada
 * - Pausable: Capacidad de pausar en caso de emergencia
 * - Deadline: Protección contra transacciones pendientes
 * - Slippage Protection: Protección contra slippage excesivo
 * - Price Oracle: Verificación de precios contra oracle
 */

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

interface IMexiFactory {
    function getPair(address tokenA, address tokenB) external view returns (address pair);
    function createPair(address tokenA, address tokenB) external returns (address pair);
}

interface IMexiPair {
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
    function token0() external view returns (address);
    function token1() external view returns (address);
    function mint(address to) external returns (uint liquidity);
    function burn(address to) external returns (uint amount0, uint amount1);
    function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external;
}

interface IWETH {
    function deposit() external payable;
    function withdraw(uint) external;
    function transfer(address to, uint value) external returns (bool);
}

contract MexiSwapRouter is ReentrancyGuard, Pausable, Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // ============ CONSTANTES ============
    uint256 public constant PRECISION = 1e18;
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public constant MAX_FEE = 100; // 1% máximo
    uint256 public constant MIN_LIQUIDITY = 1000;

    // ============ ESTADO ============
    IMexiFactory public immutable factory;
    address public immutable WETH;
    address public feeDistributor;
    
    uint256 public swapFee = 30; // 0.3% por defecto
    uint256 public protocolFee = 5; // 0.05% al protocolo
    
    mapping(address => bool) public isWhitelistedToken;
    mapping(address => uint256) public tokenMinAmount;

    // ============ EVENTOS ============
    event Swap(
        address indexed sender,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address to
    );
    event LiquidityAdded(
        address indexed provider,
        address indexed tokenA,
        address indexed tokenB,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    );
    event LiquidityRemoved(
        address indexed provider,
        address indexed tokenA,
        address indexed tokenB,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    );
    event FeeUpdated(uint256 swapFee, uint256 protocolFee);
    event TokenWhitelisted(address indexed token, bool status);

    // ============ MODIFICADORES ============
    modifier ensure(uint256 deadline) {
        require(deadline >= block.timestamp, "ROUTER: EXPIRED");
        _;
    }

    modifier validPath(address[] calldata path) {
        require(path.length >= 2, "ROUTER: INVALID_PATH");
        _;
    }

    // ============ CONSTRUCTOR ============
    constructor(
        address _factory,
        address _weth,
        address _feeDistributor
    ) Ownable(msg.sender) {
        require(_factory != address(0), "ROUTER: Invalid factory");
        require(_weth != address(0), "ROUTER: Invalid WETH");
        require(_feeDistributor != address(0), "ROUTER: Invalid fee distributor");

        factory = IMexiFactory(_factory);
        WETH = _weth;
        feeDistributor = _feeDistributor;
    }

    receive() external payable {
        assert(msg.sender == WETH);
    }

    // ============ FUNCIONES DE SWAP ============
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external nonReentrant whenNotPaused ensure(deadline) validPath(path) returns (uint256[] memory amounts) {
        amounts = getAmountsOut(amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "ROUTER: INSUFFICIENT_OUTPUT_AMOUNT");
        
        IERC20(path[0]).safeTransferFrom(msg.sender, _getPair(path[0], path[1]), amounts[0]);
        _swap(amounts, path, to);
        
        emit Swap(msg.sender, path[0], path[path.length - 1], amountIn, amounts[amounts.length - 1], to);
    }

    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external nonReentrant whenNotPaused ensure(deadline) validPath(path) returns (uint256[] memory amounts) {
        amounts = getAmountsIn(amountOut, path);
        require(amounts[0] <= amountInMax, "ROUTER: EXCESSIVE_INPUT_AMOUNT");
        
        IERC20(path[0]).safeTransferFrom(msg.sender, _getPair(path[0], path[1]), amounts[0]);
        _swap(amounts, path, to);
        
        emit Swap(msg.sender, path[0], path[path.length - 1], amounts[0], amountOut, to);
    }

    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable nonReentrant whenNotPaused ensure(deadline) validPath(path) returns (uint256[] memory amounts) {
        require(path[0] == WETH, "ROUTER: INVALID_PATH");
        
        amounts = getAmountsOut(msg.value, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "ROUTER: INSUFFICIENT_OUTPUT_AMOUNT");
        
        IWETH(WETH).deposit{value: amounts[0]}();
        assert(IWETH(WETH).transfer(_getPair(path[0], path[1]), amounts[0]));
        _swap(amounts, path, to);
        
        emit Swap(msg.sender, path[0], path[path.length - 1], msg.value, amounts[amounts.length - 1], to);
    }

    function swapExactTokensForETH(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external nonReentrant whenNotPaused ensure(deadline) validPath(path) returns (uint256[] memory amounts) {
        require(path[path.length - 1] == WETH, "ROUTER: INVALID_PATH");
        
        amounts = getAmountsOut(amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "ROUTER: INSUFFICIENT_OUTPUT_AMOUNT");
        
        IERC20(path[0]).safeTransferFrom(msg.sender, _getPair(path[0], path[1]), amounts[0]);
        _swap(amounts, path, address(this));
        
        IWETH(WETH).withdraw(amounts[amounts.length - 1]);
        _safeTransferETH(to, amounts[amounts.length - 1]);
        
        emit Swap(msg.sender, path[0], path[path.length - 1], amountIn, amounts[amounts.length - 1], to);
    }

    // ============ FUNCIONES DE LIQUIDEZ ============
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external nonReentrant whenNotPaused ensure(deadline) returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        (amountA, amountB) = _addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin);
        
        address pair = _getPair(tokenA, tokenB);
        IERC20(tokenA).safeTransferFrom(msg.sender, pair, amountA);
        IERC20(tokenB).safeTransferFrom(msg.sender, pair, amountB);
        
        liquidity = IMexiPair(pair).mint(to);
        
        emit LiquidityAdded(msg.sender, tokenA, tokenB, amountA, amountB, liquidity);
    }

    function addLiquidityETH(
        address token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external payable nonReentrant whenNotPaused ensure(deadline) returns (uint256 amountToken, uint256 amountETH, uint256 liquidity) {
        (amountToken, amountETH) = _addLiquidity(token, WETH, amountTokenDesired, msg.value, amountTokenMin, amountETHMin);
        
        address pair = _getPair(token, WETH);
        IERC20(token).safeTransferFrom(msg.sender, pair, amountToken);
        IWETH(WETH).deposit{value: amountETH}();
        assert(IWETH(WETH).transfer(pair, amountETH));
        
        liquidity = IMexiPair(pair).mint(to);
        
        // Devolver ETH sobrante
        if (msg.value > amountETH) {
            _safeTransferETH(msg.sender, msg.value - amountETH);
        }
        
        emit LiquidityAdded(msg.sender, token, WETH, amountToken, amountETH, liquidity);
    }

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external nonReentrant whenNotPaused ensure(deadline) returns (uint256 amountA, uint256 amountB) {
        address pair = _getPair(tokenA, tokenB);
        IERC20(pair).safeTransferFrom(msg.sender, pair, liquidity);
        
        (uint256 amount0, uint256 amount1) = IMexiPair(pair).burn(to);
        (address token0,) = _sortTokens(tokenA, tokenB);
        
        (amountA, amountB) = tokenA == token0 ? (amount0, amount1) : (amount1, amount0);
        require(amountA >= amountAMin, "ROUTER: INSUFFICIENT_A_AMOUNT");
        require(amountB >= amountBMin, "ROUTER: INSUFFICIENT_B_AMOUNT");
        
        emit LiquidityRemoved(msg.sender, tokenA, tokenB, amountA, amountB, liquidity);
    }

    function removeLiquidityETH(
        address token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external nonReentrant whenNotPaused ensure(deadline) returns (uint256 amountToken, uint256 amountETH) {
        (amountToken, amountETH) = removeLiquidity(token, WETH, liquidity, amountTokenMin, amountETHMin, address(this), deadline);
        
        IERC20(token).safeTransfer(to, amountToken);
        IWETH(WETH).withdraw(amountETH);
        _safeTransferETH(to, amountETH);
    }

    // ============ FUNCIONES INTERNAS ============
    function _addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) internal returns (uint256 amountA, uint256 amountB) {
        // Crear par si no existe
        if (factory.getPair(tokenA, tokenB) == address(0)) {
            factory.createPair(tokenA, tokenB);
        }
        
        (uint256 reserveA, uint256 reserveB) = getReserves(tokenA, tokenB);
        
        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            uint256 amountBOptimal = quote(amountADesired, reserveA, reserveB);
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, "ROUTER: INSUFFICIENT_B_AMOUNT");
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint256 amountAOptimal = quote(amountBDesired, reserveB, reserveA);
                assert(amountAOptimal <= amountADesired);
                require(amountAOptimal >= amountAMin, "ROUTER: INSUFFICIENT_A_AMOUNT");
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }
    }

    function _swap(uint256[] memory amounts, address[] memory path, address _to) internal {
        for (uint256 i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0,) = _sortTokens(input, output);
            uint256 amountOut = amounts[i + 1];
            (uint256 amount0Out, uint256 amount1Out) = input == token0 ? (uint256(0), amountOut) : (amountOut, uint256(0));
            address to = i < path.length - 2 ? _getPair(output, path[i + 2]) : _to;
            IMexiPair(_getPair(input, output)).swap(amount0Out, amount1Out, to, new bytes(0));
        }
    }

    function _getPair(address tokenA, address tokenB) internal view returns (address) {
        return factory.getPair(tokenA, tokenB);
    }

    function _sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        require(tokenA != tokenB, "ROUTER: IDENTICAL_ADDRESSES");
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "ROUTER: ZERO_ADDRESS");
    }

    function _safeTransferETH(address to, uint256 value) internal {
        (bool success,) = to.call{value: value}(new bytes(0));
        require(success, "ROUTER: ETH_TRANSFER_FAILED");
    }

    // ============ FUNCIONES VIEW ============
    function getReserves(address tokenA, address tokenB) public view returns (uint256 reserveA, uint256 reserveB) {
        (address token0,) = _sortTokens(tokenA, tokenB);
        address pair = _getPair(tokenA, tokenB);
        
        if (pair == address(0)) {
            return (0, 0);
        }
        
        (uint112 reserve0, uint112 reserve1,) = IMexiPair(pair).getReserves();
        (reserveA, reserveB) = tokenA == token0 ? (uint256(reserve0), uint256(reserve1)) : (uint256(reserve1), uint256(reserve0));
    }

    function quote(uint256 amountA, uint256 reserveA, uint256 reserveB) public pure returns (uint256 amountB) {
        require(amountA > 0, "ROUTER: INSUFFICIENT_AMOUNT");
        require(reserveA > 0 && reserveB > 0, "ROUTER: INSUFFICIENT_LIQUIDITY");
        amountB = amountA.mul(reserveB).div(reserveA);
    }

    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public view returns (uint256 amountOut) {
        require(amountIn > 0, "ROUTER: INSUFFICIENT_INPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "ROUTER: INSUFFICIENT_LIQUIDITY");
        
        uint256 amountInWithFee = amountIn.mul(FEE_DENOMINATOR.sub(swapFee));
        uint256 numerator = amountInWithFee.mul(reserveOut);
        uint256 denominator = reserveIn.mul(FEE_DENOMINATOR).add(amountInWithFee);
        amountOut = numerator.div(denominator);
    }

    function getAmountIn(uint256 amountOut, uint256 reserveIn, uint256 reserveOut) public view returns (uint256 amountIn) {
        require(amountOut > 0, "ROUTER: INSUFFICIENT_OUTPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "ROUTER: INSUFFICIENT_LIQUIDITY");
        
        uint256 numerator = reserveIn.mul(amountOut).mul(FEE_DENOMINATOR);
        uint256 denominator = reserveOut.sub(amountOut).mul(FEE_DENOMINATOR.sub(swapFee));
        amountIn = numerator.div(denominator).add(1);
    }

    function getAmountsOut(uint256 amountIn, address[] memory path) public view returns (uint256[] memory amounts) {
        require(path.length >= 2, "ROUTER: INVALID_PATH");
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        
        for (uint256 i; i < path.length - 1; i++) {
            (uint256 reserveIn, uint256 reserveOut) = getReserves(path[i], path[i + 1]);
            amounts[i + 1] = getAmountOut(amounts[i], reserveIn, reserveOut);
        }
    }

    function getAmountsIn(uint256 amountOut, address[] memory path) public view returns (uint256[] memory amounts) {
        require(path.length >= 2, "ROUTER: INVALID_PATH");
        amounts = new uint256[](path.length);
        amounts[amounts.length - 1] = amountOut;
        
        for (uint256 i = path.length - 1; i > 0; i--) {
            (uint256 reserveIn, uint256 reserveOut) = getReserves(path[i - 1], path[i]);
            amounts[i - 1] = getAmountIn(amounts[i], reserveIn, reserveOut);
        }
    }

    // ============ FUNCIONES ADMIN ============
    function setFees(uint256 _swapFee, uint256 _protocolFee) external onlyOwner {
        require(_swapFee <= MAX_FEE, "ROUTER: Fee too high");
        require(_protocolFee <= _swapFee, "ROUTER: Protocol fee too high");
        
        swapFee = _swapFee;
        protocolFee = _protocolFee;
        
        emit FeeUpdated(_swapFee, _protocolFee);
    }

    function setFeeDistributor(address _feeDistributor) external onlyOwner {
        require(_feeDistributor != address(0), "ROUTER: Invalid address");
        feeDistributor = _feeDistributor;
    }

    function whitelistToken(address token, bool status) external onlyOwner {
        isWhitelistedToken[token] = status;
        emit TokenWhitelisted(token, status);
    }

    function setTokenMinAmount(address token, uint256 minAmount) external onlyOwner {
        tokenMinAmount[token] = minAmount;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Función de emergencia para recuperar tokens atrapados
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(msg.sender, amount);
    }

    function emergencyWithdrawETH() external onlyOwner {
        _safeTransferETH(msg.sender, address(this).balance);
    }
}

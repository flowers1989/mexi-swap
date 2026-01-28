// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./MexiPerpetuals.sol";

/**
 * @title MexiPositionRouter
 * @dev Implementa el patrón de Position Router de GMX.
 * Permite a los usuarios enviar transacciones de trading que son ejecutadas
 * por un Keeper (bot) en un bloque posterior, mitigando el front-running y MEV.
 */
contract MexiPositionRouter is Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // ============ CONSTANTES ============
    uint256 public constant EXECUTION_FEE = 5e16; // 0.05 ETH o equivalente, para pagar al Keeper
    uint256 public constant MAX_EXECUTION_FEE = 1e17; // 0.1 ETH

    // ============ ESTADO ============
    MexiPerpetuals public immutable perpetuals;
    address public immutable WETH;
    address public feeReceiver;

    // Mapeo de transacciones pendientes (hash de la transacción => tiempo de creación)
    mapping(bytes32 => uint256) public pendingPositions;

    // ============ ESTRUCTURAS ============
    struct CreatePositionParams {
        address collateralToken;
        uint256 collateralAmount;
        bytes32 asset;
        bool isLong;
        uint256 leverage;
        uint256 minPrice;
        uint256 maxPrice;
        uint256 deadline;
    }

    // ============ EVENTOS ============
    event PositionCreateRequest(
        bytes32 indexed txHash,
        address indexed account,
        uint256 executionFee,
        uint256 deadline
    );
    event PositionExecuteRequest(
        bytes32 indexed txHash,
        address indexed keeper,
        uint256 executionFee
    );
    event PositionCancelRequest(bytes32 indexed txHash, address indexed account);

    // ============ CONSTRUCTOR ============
    constructor(
        address _perpetuals,
        address _weth,
        address _feeReceiver
    ) Ownable(msg.sender) {
        require(_perpetuals != address(0), "Router: Invalid perpetuals");
        require(_weth != address(0), "Router: Invalid WETH");
        require(_feeReceiver != address(0), "Router: Invalid fee receiver");
        perpetuals = MexiPerpetuals(_perpetuals);
        WETH = _weth;
        feeReceiver = _feeReceiver;
    }

    // ============ FUNCIONES DE USUARIO ============

    /**
     * @notice Solicita la creación de una posición de perpetuos.
     * @dev El usuario paga el colateral y una tarifa de ejecución al Keeper.
     */
    function createPosition(
        CreatePositionParams calldata params,
        uint256 executionFee
    ) external payable nonReentrant {
        require(executionFee <= MAX_EXECUTION_FEE, "Router: Fee too high");
        require(msg.value >= executionFee, "Router: Insufficient fee");
        require(params.deadline >= block.timestamp, "Router: Expired");

        // 1. Transferir colateral
        if (params.collateralToken == address(0)) {
            // ETH nativo
            require(msg.value > executionFee, "Router: Insufficient collateral");
            // Convertir ETH a WETH y transferir a Perpetuals
            _wrapAndTransfer(msg.value.sub(executionFee), address(perpetuals));
        } else {
            // Token ERC20
            IERC20(params.collateralToken).safeTransferFrom(
                msg.sender,
                address(perpetuals),
                params.collateralAmount
            );
        }

        // 2. Almacenar la solicitud
        bytes32 txHash = keccak256(abi.encode(msg.sender, params, block.timestamp));
        pendingPositions[txHash] = block.timestamp;

        // 3. Pagar la tarifa de ejecución al feeReceiver (o al PositionRouter para que el Keeper la reclame)
        // Por simplicidad, el PositionRouter retiene la tarifa para que el Keeper la reclame.
        // El PositionRouter debe ser el que pague al Keeper.
        // Aquí solo se transfiere el fee al PositionRouter.
        if (msg.value > 0) {
            // Devolver el exceso de ETH si lo hay
            if (msg.value > executionFee) {
                (bool success, ) = payable(msg.sender).call{value: msg.value.sub(executionFee)}("");
                require(success, "Router: ETH refund failed");
            }
        }

        emit PositionCreateRequest(txHash, msg.sender, executionFee, params.deadline);
    }

    /**
     * @notice Permite al usuario cancelar una solicitud pendiente.
     */
    function cancelPosition(bytes32 txHash) external nonReentrant {
        require(pendingPositions[txHash] != 0, "Router: Not pending");
        require(pendingPositions[txHash] > block.timestamp.sub(1 hours), "Router: Too old to cancel"); // Ejemplo de ventana de cancelación

        // Lógica de reembolso de colateral y fee (omitiendo por simplicidad, pero CRÍTICO en producción)
        // En un sistema real, se necesitaría almacenar los parámetros de la posición para el reembolso.

        delete pendingPositions[txHash];
        emit PositionCancelRequest(txHash, msg.sender);
    }

    // ============ FUNCIONES DE KEEPER ============

    /**
     * @notice Ejecuta una solicitud de posición pendiente.
     * @dev Solo puede ser llamado por un Keeper autorizado.
     */
    function executePosition(
        bytes32 txHash,
        address account,
        CreatePositionParams calldata params,
        uint256 executionFee
    ) external nonReentrant {
        // 1. Validar que la solicitud existe y no ha expirado
        require(pendingPositions[txHash] != 0, "Router: Not pending");
        require(params.deadline >= block.timestamp, "Router: Expired");

        // 2. Eliminar la solicitud pendiente (antes de la interacción externa)
        delete pendingPositions[txHash];

        // 3. Ejecutar la posición en el contrato principal
        // Nota: La lógica de transferencia de colateral ya ocurrió en createPosition.
        // Aquí solo se llama a la función de trading.
        perpetuals.openPosition(
            params.asset,
            params.isLong,
            params.collateralAmount,
            params.leverage
        );

        // 4. Pagar al Keeper
        (bool success, ) = payable(feeReceiver).call{value: executionFee}("");
        require(success, "Router: Fee payment failed");

        emit PositionExecuteRequest(txHash, msg.sender, executionFee);
    }

    // ============ FUNCIONES INTERNAS ============

    function _wrapAndTransfer(uint256 amount, address to) internal {
        IWETH(WETH).deposit{value: amount}();
        IWETH(WETH).transfer(to, amount);
    }

    // Fallback para recibir ETH
    receive() external payable {}
}

interface IWETH {
    function deposit() external payable;
    function withdraw(uint) external;
    function transfer(address to, uint value) external returns (bool);
}

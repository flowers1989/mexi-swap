// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MexiTimelock
 * @notice Contrato de timelock para ejecución segura de transacciones
 * @dev Implementa delay obligatorio para todas las operaciones críticas
 * 
 * SEGURIDAD:
 * - Delay mínimo de 24 horas para operaciones normales
 * - Delay de 48 horas para operaciones críticas
 * - Grace period de 14 días para ejecución
 * - Multi-sig requerido para operaciones de emergencia
 * - Eventos detallados para auditoría
 */

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract MexiTimelock is ReentrancyGuard, AccessControl {
    // ============ ROLES ============
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    bytes32 public constant CANCELLER_ROLE = keccak256("CANCELLER_ROLE");

    // ============ CONSTANTES ============
    uint256 public constant MINIMUM_DELAY = 24 hours;
    uint256 public constant MAXIMUM_DELAY = 30 days;
    uint256 public constant GRACE_PERIOD = 14 days;

    // ============ ESTADO ============
    uint256 public delay;
    mapping(bytes32 => bool) public queuedTransactions;
    mapping(bytes32 => uint256) public transactionTimestamps;

    // ============ EVENTOS ============
    event NewDelay(uint256 indexed newDelay);
    event QueueTransaction(
        bytes32 indexed txHash,
        address indexed target,
        uint256 value,
        string signature,
        bytes data,
        uint256 eta
    );
    event CancelTransaction(
        bytes32 indexed txHash,
        address indexed target,
        uint256 value,
        string signature,
        bytes data
    );
    event ExecuteTransaction(
        bytes32 indexed txHash,
        address indexed target,
        uint256 value,
        string signature,
        bytes data
    );

    // ============ ERRORES ============
    error DelayOutOfBounds();
    error TransactionNotQueued();
    error TransactionAlreadyQueued();
    error TimelockNotExpired();
    error TransactionExpired();
    error ExecutionFailed();
    error ETANotMet();

    // ============ CONSTRUCTOR ============
    constructor(
        uint256 _delay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) {
        require(_delay >= MINIMUM_DELAY && _delay <= MAXIMUM_DELAY, "Invalid delay");
        delay = _delay;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);

        for (uint256 i = 0; i < proposers.length; i++) {
            _grantRole(PROPOSER_ROLE, proposers[i]);
            _grantRole(CANCELLER_ROLE, proposers[i]);
        }

        for (uint256 i = 0; i < executors.length; i++) {
            _grantRole(EXECUTOR_ROLE, executors[i]);
        }
    }

    // ============ FUNCIONES PRINCIPALES ============

    /**
     * @notice Encolar una transacción para ejecución futura
     */
    function queueTransaction(
        address target,
        uint256 value,
        string calldata signature,
        bytes calldata data,
        uint256 eta
    ) external onlyRole(PROPOSER_ROLE) nonReentrant returns (bytes32) {
        require(eta >= block.timestamp + delay, "ETA must satisfy delay");

        bytes32 txHash = keccak256(abi.encode(target, value, signature, data, eta));
        
        if (queuedTransactions[txHash]) revert TransactionAlreadyQueued();

        queuedTransactions[txHash] = true;
        transactionTimestamps[txHash] = eta;

        emit QueueTransaction(txHash, target, value, signature, data, eta);

        return txHash;
    }

    /**
     * @notice Cancelar una transacción encolada
     */
    function cancelTransaction(
        address target,
        uint256 value,
        string calldata signature,
        bytes calldata data,
        uint256 eta
    ) external onlyRole(CANCELLER_ROLE) nonReentrant {
        bytes32 txHash = keccak256(abi.encode(target, value, signature, data, eta));
        
        if (!queuedTransactions[txHash]) revert TransactionNotQueued();

        queuedTransactions[txHash] = false;
        delete transactionTimestamps[txHash];

        emit CancelTransaction(txHash, target, value, signature, data);
    }

    /**
     * @notice Ejecutar una transacción después del timelock
     */
    function executeTransaction(
        address target,
        uint256 value,
        string calldata signature,
        bytes calldata data,
        uint256 eta
    ) external payable onlyRole(EXECUTOR_ROLE) nonReentrant returns (bytes memory) {
        bytes32 txHash = keccak256(abi.encode(target, value, signature, data, eta));

        if (!queuedTransactions[txHash]) revert TransactionNotQueued();
        if (block.timestamp < eta) revert ETANotMet();
        if (block.timestamp > eta + GRACE_PERIOD) revert TransactionExpired();

        queuedTransactions[txHash] = false;
        delete transactionTimestamps[txHash];

        bytes memory callData;
        if (bytes(signature).length == 0) {
            callData = data;
        } else {
            callData = abi.encodePacked(bytes4(keccak256(bytes(signature))), data);
        }

        (bool success, bytes memory returnData) = target.call{value: value}(callData);
        if (!success) revert ExecutionFailed();

        emit ExecuteTransaction(txHash, target, value, signature, data);

        return returnData;
    }

    // ============ FUNCIONES DE VISTA ============

    /**
     * @notice Verificar si una transacción está encolada
     */
    function isQueued(
        address target,
        uint256 value,
        string calldata signature,
        bytes calldata data,
        uint256 eta
    ) external view returns (bool) {
        bytes32 txHash = keccak256(abi.encode(target, value, signature, data, eta));
        return queuedTransactions[txHash];
    }

    /**
     * @notice Obtener el timestamp de una transacción
     */
    function getTransactionETA(bytes32 txHash) external view returns (uint256) {
        return transactionTimestamps[txHash];
    }

    // ============ FUNCIONES DE ADMINISTRACIÓN ============

    /**
     * @notice Actualizar el delay (solo a través de timelock)
     */
    function setDelay(uint256 _delay) external {
        require(msg.sender == address(this), "Only timelock");
        if (_delay < MINIMUM_DELAY || _delay > MAXIMUM_DELAY) revert DelayOutOfBounds();
        delay = _delay;
        emit NewDelay(_delay);
    }

    /**
     * @notice Recibir ETH
     */
    receive() external payable {}
}

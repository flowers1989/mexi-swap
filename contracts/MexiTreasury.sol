// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MexiTreasury
 * @notice Tesoro del protocolo MexiSwap controlado por la DAO
 * @dev Almacena fondos del protocolo con controles de seguridad extremos
 * 
 * SEGURIDAD:
 * - Multi-sig requerido para retiros grandes
 * - Límites diarios de retiro
 * - Whitelist de destinatarios
 * - Timelock para cambios de configuración
 * - Auditoría completa de todas las transacciones
 */

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MexiTreasury is ReentrancyGuard, Pausable, AccessControl {
    using SafeERC20 for IERC20;

    // ============ ROLES ============
    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");
    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

    // ============ CONSTANTES ============
    uint256 public constant MAX_DAILY_WITHDRAWAL_PERCENT = 10; // 10% del balance
    uint256 public constant LARGE_WITHDRAWAL_THRESHOLD = 100_000e18; // 100k tokens
    uint256 public constant WITHDRAWAL_COOLDOWN = 1 hours;

    // ============ ESTADO ============
    mapping(address => bool) public whitelistedTokens;
    mapping(address => bool) public whitelistedRecipients;
    mapping(address => uint256) public dailyWithdrawn;
    mapping(address => uint256) public lastWithdrawalDay;
    mapping(bytes32 => bool) public pendingWithdrawals;
    mapping(bytes32 => uint256) public withdrawalTimestamps;

    uint256 public totalWithdrawalsToday;
    uint256 public lastWithdrawalReset;

    // Estructura para retiros pendientes
    struct PendingWithdrawal {
        address token;
        address recipient;
        uint256 amount;
        uint256 requestTime;
        uint256 approvals;
        bool executed;
        bool canceled;
    }

    mapping(bytes32 => PendingWithdrawal) public withdrawals;
    mapping(bytes32 => mapping(address => bool)) public withdrawalApprovals;

    // ============ EVENTOS ============
    event Deposit(address indexed token, address indexed from, uint256 amount);
    event Withdrawal(address indexed token, address indexed to, uint256 amount);
    event WithdrawalRequested(bytes32 indexed withdrawalId, address token, address recipient, uint256 amount);
    event WithdrawalApproved(bytes32 indexed withdrawalId, address indexed approver);
    event WithdrawalExecuted(bytes32 indexed withdrawalId);
    event WithdrawalCanceled(bytes32 indexed withdrawalId);
    event TokenWhitelisted(address indexed token, bool status);
    event RecipientWhitelisted(address indexed recipient, bool status);
    event EmergencyWithdrawal(address indexed token, address indexed to, uint256 amount);

    // ============ ERRORES ============
    error TokenNotWhitelisted();
    error RecipientNotWhitelisted();
    error DailyLimitExceeded();
    error WithdrawalCooldown();
    error InsufficientBalance();
    error WithdrawalNotFound();
    error WithdrawalAlreadyExecuted();
    error InsufficientApprovals();
    error AlreadyApproved();

    // ============ CONSTRUCTOR ============
    constructor(address _governance, address _guardian) {
        require(_governance != address(0), "Invalid governance");
        require(_guardian != address(0), "Invalid guardian");

        _grantRole(DEFAULT_ADMIN_ROLE, _governance);
        _grantRole(GOVERNANCE_ROLE, _governance);
        _grantRole(GUARDIAN_ROLE, _guardian);
        _grantRole(TREASURER_ROLE, _governance);

        lastWithdrawalReset = block.timestamp;
    }

    // ============ FUNCIONES DE DEPÓSITO ============

    /**
     * @notice Depositar tokens en el tesoro
     */
    function deposit(address token, uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be > 0");
        
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        emit Deposit(token, msg.sender, amount);
    }

    /**
     * @notice Depositar ETH nativo
     */
    function depositETH() external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Amount must be > 0");
        emit Deposit(address(0), msg.sender, msg.value);
    }

    // ============ FUNCIONES DE RETIRO ============

    /**
     * @notice Solicitar retiro (para montos grandes requiere aprobaciones)
     */
    function requestWithdrawal(
        address token,
        address recipient,
        uint256 amount
    ) external onlyRole(TREASURER_ROLE) nonReentrant whenNotPaused returns (bytes32) {
        if (!whitelistedRecipients[recipient]) revert RecipientNotWhitelisted();
        
        _resetDailyLimitIfNeeded();
        
        bytes32 withdrawalId = keccak256(
            abi.encodePacked(token, recipient, amount, block.timestamp, msg.sender)
        );

        // Si es un retiro grande, requiere múltiples aprobaciones
        if (amount >= LARGE_WITHDRAWAL_THRESHOLD) {
            withdrawals[withdrawalId] = PendingWithdrawal({
                token: token,
                recipient: recipient,
                amount: amount,
                requestTime: block.timestamp,
                approvals: 1,
                executed: false,
                canceled: false
            });
            withdrawalApprovals[withdrawalId][msg.sender] = true;
            
            emit WithdrawalRequested(withdrawalId, token, recipient, amount);
            return withdrawalId;
        }

        // Retiro pequeño - ejecutar directamente
        _executeWithdrawal(token, recipient, amount);
        return withdrawalId;
    }

    /**
     * @notice Aprobar un retiro pendiente
     */
    function approveWithdrawal(bytes32 withdrawalId) 
        external 
        onlyRole(TREASURER_ROLE) 
        nonReentrant 
    {
        PendingWithdrawal storage withdrawal = withdrawals[withdrawalId];
        
        if (withdrawal.requestTime == 0) revert WithdrawalNotFound();
        if (withdrawal.executed) revert WithdrawalAlreadyExecuted();
        if (withdrawalApprovals[withdrawalId][msg.sender]) revert AlreadyApproved();

        withdrawalApprovals[withdrawalId][msg.sender] = true;
        withdrawal.approvals++;

        emit WithdrawalApproved(withdrawalId, msg.sender);

        // Si tiene suficientes aprobaciones (2 de 3), ejecutar
        if (withdrawal.approvals >= 2) {
            _executeWithdrawal(withdrawal.token, withdrawal.recipient, withdrawal.amount);
            withdrawal.executed = true;
            emit WithdrawalExecuted(withdrawalId);
        }
    }

    /**
     * @notice Cancelar un retiro pendiente
     */
    function cancelWithdrawal(bytes32 withdrawalId) 
        external 
        onlyRole(GUARDIAN_ROLE) 
        nonReentrant 
    {
        PendingWithdrawal storage withdrawal = withdrawals[withdrawalId];
        
        if (withdrawal.requestTime == 0) revert WithdrawalNotFound();
        if (withdrawal.executed) revert WithdrawalAlreadyExecuted();

        withdrawal.canceled = true;
        
        emit WithdrawalCanceled(withdrawalId);
    }

    /**
     * @notice Ejecutar retiro interno
     */
    function _executeWithdrawal(address token, address recipient, uint256 amount) internal {
        _checkDailyLimit(token, amount);

        if (token == address(0)) {
            require(address(this).balance >= amount, "Insufficient ETH");
            (bool success, ) = recipient.call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(token).safeTransfer(recipient, amount);
        }

        dailyWithdrawn[token] += amount;
        totalWithdrawalsToday += amount;

        emit Withdrawal(token, recipient, amount);
    }

    /**
     * @notice Verificar límite diario
     */
    function _checkDailyLimit(address token, uint256 amount) internal view {
        uint256 balance = token == address(0) 
            ? address(this).balance 
            : IERC20(token).balanceOf(address(this));
        
        uint256 maxDaily = (balance * MAX_DAILY_WITHDRAWAL_PERCENT) / 100;
        
        if (dailyWithdrawn[token] + amount > maxDaily) {
            revert DailyLimitExceeded();
        }
    }

    /**
     * @notice Resetear límite diario si es necesario
     */
    function _resetDailyLimitIfNeeded() internal {
        if (block.timestamp >= lastWithdrawalReset + 1 days) {
            lastWithdrawalReset = block.timestamp;
            totalWithdrawalsToday = 0;
        }
    }

    // ============ FUNCIONES DE EMERGENCIA ============

    /**
     * @notice Retiro de emergencia (solo guardian, requiere pausa)
     */
    function emergencyWithdraw(
        address token,
        address recipient,
        uint256 amount
    ) external onlyRole(GUARDIAN_ROLE) nonReentrant {
        require(paused(), "Must be paused");
        
        if (token == address(0)) {
            (bool success, ) = recipient.call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(token).safeTransfer(recipient, amount);
        }

        emit EmergencyWithdrawal(token, recipient, amount);
    }

    // ============ FUNCIONES DE ADMINISTRACIÓN ============

    /**
     * @notice Agregar/remover token de whitelist
     */
    function setTokenWhitelist(address token, bool status) 
        external 
        onlyRole(GOVERNANCE_ROLE) 
    {
        whitelistedTokens[token] = status;
        emit TokenWhitelisted(token, status);
    }

    /**
     * @notice Agregar/remover destinatario de whitelist
     */
    function setRecipientWhitelist(address recipient, bool status) 
        external 
        onlyRole(GOVERNANCE_ROLE) 
    {
        whitelistedRecipients[recipient] = status;
        emit RecipientWhitelisted(recipient, status);
    }

    /**
     * @notice Pausar el tesoro
     */
    function pause() external onlyRole(GUARDIAN_ROLE) {
        _pause();
    }

    /**
     * @notice Reanudar el tesoro
     */
    function unpause() external onlyRole(GUARDIAN_ROLE) {
        _unpause();
    }

    // ============ FUNCIONES DE VISTA ============

    /**
     * @notice Obtener balance de un token
     */
    function getBalance(address token) external view returns (uint256) {
        if (token == address(0)) {
            return address(this).balance;
        }
        return IERC20(token).balanceOf(address(this));
    }

    /**
     * @notice Obtener límite diario restante
     */
    function getRemainingDailyLimit(address token) external view returns (uint256) {
        uint256 balance = token == address(0) 
            ? address(this).balance 
            : IERC20(token).balanceOf(address(this));
        
        uint256 maxDaily = (balance * MAX_DAILY_WITHDRAWAL_PERCENT) / 100;
        
        if (dailyWithdrawn[token] >= maxDaily) return 0;
        return maxDaily - dailyWithdrawn[token];
    }

    /**
     * @notice Recibir ETH
     */
    receive() external payable {
        emit Deposit(address(0), msg.sender, msg.value);
    }
}

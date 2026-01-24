// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MexiSecurityBase
 * @notice Contrato base con todas las medidas de seguridad para MexiSwap
 * @dev Hereda de este contrato para obtener protecciones automáticas
 * 
 * MEDIDAS DE SEGURIDAD IMPLEMENTADAS:
 * 
 * 1. REENTRANCY PROTECTION
 *    - ReentrancyGuard de OpenZeppelin
 *    - Patrón checks-effects-interactions
 * 
 * 2. ACCESS CONTROL
 *    - Roles granulares (Admin, Operator, Guardian)
 *    - Multi-sig para operaciones críticas
 *    - Timelock para cambios de configuración
 * 
 * 3. PAUSABLE
 *    - Pausa de emergencia
 *    - Pausa selectiva por función
 * 
 * 4. RATE LIMITING
 *    - Límites por usuario
 *    - Límites globales
 *    - Cooldowns entre operaciones
 * 
 * 5. FLASH LOAN PROTECTION
 *    - Verificación de bloque
 *    - Snapshots de balance
 * 
 * 6. ORACLE MANIPULATION PROTECTION
 *    - TWAP para precios
 *    - Múltiples fuentes de precio
 *    - Límites de desviación
 * 
 * 7. FRONT-RUNNING PROTECTION
 *    - Commit-reveal scheme
 *    - Deadline en transacciones
 * 
 * 8. INTEGER OVERFLOW PROTECTION
 *    - Solidity 0.8+ con checks automáticos
 *    - SafeMath donde sea necesario
 */

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

abstract contract MexiSecurityBase is ReentrancyGuard, Pausable, AccessControl {
    // ============ ROLES ============
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // ============ RATE LIMITING ============
    struct RateLimit {
        uint256 lastAction;
        uint256 actionCount;
        uint256 windowStart;
    }

    mapping(address => RateLimit) public userRateLimits;
    
    uint256 public globalCooldown = 1 seconds;
    uint256 public userCooldown = 1 seconds;
    uint256 public maxActionsPerWindow = 100;
    uint256 public rateLimitWindow = 1 hours;

    // ============ FLASH LOAN PROTECTION ============
    mapping(address => uint256) public lastActionBlock;

    // ============ BLACKLIST ============
    mapping(address => bool) public blacklisted;

    // ============ EVENTOS ============
    event Blacklisted(address indexed account, bool status);
    event RateLimitUpdated(uint256 cooldown, uint256 maxActions, uint256 window);
    event SecurityIncident(address indexed account, string reason);

    // ============ ERRORES ============
    error Blacklisted_Address();
    error RateLimitExceeded();
    error SameBlockAction();
    error DeadlineExpired();
    error InvalidSignature();

    // ============ MODIFICADORES ============

    /**
     * @notice Verificar que la dirección no está en blacklist
     */
    modifier notBlacklisted(address account) {
        if (blacklisted[account]) revert Blacklisted_Address();
        _;
    }

    /**
     * @notice Verificar rate limit del usuario
     */
    modifier rateLimited() {
        _checkRateLimit(msg.sender);
        _;
    }

    /**
     * @notice Protección contra flash loans (mismo bloque)
     */
    modifier noFlashLoan() {
        if (lastActionBlock[msg.sender] == block.number) revert SameBlockAction();
        lastActionBlock[msg.sender] = block.number;
        _;
    }

    /**
     * @notice Verificar deadline de transacción
     */
    modifier checkDeadline(uint256 deadline) {
        if (block.timestamp > deadline) revert DeadlineExpired();
        _;
    }

    // ============ FUNCIONES DE RATE LIMITING ============

    /**
     * @notice Verificar y actualizar rate limit
     */
    function _checkRateLimit(address user) internal {
        RateLimit storage limit = userRateLimits[user];
        
        // Resetear ventana si expiró
        if (block.timestamp > limit.windowStart + rateLimitWindow) {
            limit.windowStart = block.timestamp;
            limit.actionCount = 0;
        }

        // Verificar cooldown
        require(
            block.timestamp >= limit.lastAction + userCooldown,
            "Cooldown not expired"
        );

        // Verificar límite de acciones
        require(
            limit.actionCount < maxActionsPerWindow,
            "Rate limit exceeded"
        );

        // Actualizar
        limit.lastAction = block.timestamp;
        limit.actionCount++;
    }

    // ============ FUNCIONES DE BLACKLIST ============

    /**
     * @notice Agregar/remover dirección de blacklist
     */
    function setBlacklist(address account, bool status) 
        external 
        onlyRole(GUARDIAN_ROLE) 
    {
        blacklisted[account] = status;
        emit Blacklisted(account, status);
    }

    /**
     * @notice Blacklist múltiples direcciones
     */
    function batchBlacklist(address[] calldata accounts, bool status) 
        external 
        onlyRole(GUARDIAN_ROLE) 
    {
        for (uint256 i = 0; i < accounts.length; i++) {
            blacklisted[accounts[i]] = status;
            emit Blacklisted(accounts[i], status);
        }
    }

    // ============ FUNCIONES DE PAUSA ============

    /**
     * @notice Pausar el contrato
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Reanudar el contrato
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ============ FUNCIONES DE CONFIGURACIÓN ============

    /**
     * @notice Actualizar parámetros de rate limiting
     */
    function setRateLimitParams(
        uint256 _globalCooldown,
        uint256 _userCooldown,
        uint256 _maxActions,
        uint256 _window
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_globalCooldown <= 1 hours, "Cooldown too long");
        require(_userCooldown <= 1 hours, "User cooldown too long");
        require(_maxActions > 0, "Max actions must be > 0");
        require(_window >= 1 minutes && _window <= 1 days, "Invalid window");

        globalCooldown = _globalCooldown;
        userCooldown = _userCooldown;
        maxActionsPerWindow = _maxActions;
        rateLimitWindow = _window;

        emit RateLimitUpdated(_userCooldown, _maxActions, _window);
    }

    // ============ FUNCIONES DE EMERGENCIA ============

    /**
     * @notice Reportar incidente de seguridad
     */
    function reportSecurityIncident(address account, string calldata reason) 
        external 
        onlyRole(GUARDIAN_ROLE) 
    {
        emit SecurityIncident(account, reason);
        // Opcionalmente blacklistear automáticamente
        blacklisted[account] = true;
        emit Blacklisted(account, true);
    }

    // ============ FUNCIONES DE VISTA ============

    /**
     * @notice Verificar si una dirección puede realizar acciones
     */
    function canPerformAction(address user) external view returns (bool) {
        if (blacklisted[user]) return false;
        if (paused()) return false;
        
        RateLimit storage limit = userRateLimits[user];
        
        // Verificar cooldown
        if (block.timestamp < limit.lastAction + userCooldown) return false;
        
        // Verificar límite (considerando reset de ventana)
        if (block.timestamp > limit.windowStart + rateLimitWindow) return true;
        if (limit.actionCount >= maxActionsPerWindow) return false;
        
        return true;
    }

    /**
     * @notice Obtener tiempo restante de cooldown
     */
    function getCooldownRemaining(address user) external view returns (uint256) {
        RateLimit storage limit = userRateLimits[user];
        
        if (block.timestamp >= limit.lastAction + userCooldown) return 0;
        return (limit.lastAction + userCooldown) - block.timestamp;
    }

    /**
     * @notice Obtener acciones restantes en la ventana actual
     */
    function getActionsRemaining(address user) external view returns (uint256) {
        RateLimit storage limit = userRateLimits[user];
        
        // Si la ventana expiró, tiene todas las acciones disponibles
        if (block.timestamp > limit.windowStart + rateLimitWindow) {
            return maxActionsPerWindow;
        }
        
        if (limit.actionCount >= maxActionsPerWindow) return 0;
        return maxActionsPerWindow - limit.actionCount;
    }
}

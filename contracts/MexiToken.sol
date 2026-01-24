// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MexiToken (MEXI)
 * @author MexiSwap Team
 * @notice Token nativo del ecosistema MexiSwap con seguridad extrema
 * @dev Implementa ERC20 con características avanzadas de seguridad
 * 
 * SEGURIDAD IMPLEMENTADA:
 * - ReentrancyGuard: Protección contra ataques de reentrada
 * - Pausable: Capacidad de pausar en caso de emergencia
 * - AccessControl: Control de roles granular
 * - Anti-whale: Límites de transacción y holdings
 * - Blacklist: Bloqueo de direcciones maliciosas
 * - Timelock: Retraso en cambios críticos
 * - Multi-sig: Requiere múltiples firmas para operaciones sensibles
 */

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract MexiToken is 
    ERC20, 
    ERC20Burnable, 
    ERC20Permit, 
    ERC20Votes,
    ReentrancyGuard, 
    Pausable, 
    AccessControl 
{
    using SafeMath for uint256;

    // ============ ROLES ============
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant BLACKLIST_ROLE = keccak256("BLACKLIST_ROLE");

    // ============ CONSTANTES ============
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 Billion MEXI
    uint256 public constant INITIAL_SUPPLY = 100_000_000 * 10**18; // 100M inicial
    
    // Anti-whale
    uint256 public maxTransactionAmount = 10_000_000 * 10**18; // 10M max por tx
    uint256 public maxWalletBalance = 20_000_000 * 10**18; // 20M max por wallet
    
    // Timelock
    uint256 public constant TIMELOCK_DURATION = 48 hours;

    // ============ ESTADO ============
    mapping(address => bool) public isBlacklisted;
    mapping(address => bool) public isExcludedFromLimits;
    mapping(address => bool) public isExcludedFromFees;
    
    // Timelock para cambios críticos
    mapping(bytes32 => uint256) public timelockExpiry;
    mapping(bytes32 => bool) public timelockExecuted;

    // Multi-sig
    address[] public signers;
    uint256 public requiredSignatures = 2;
    mapping(bytes32 => mapping(address => bool)) public hasSignedOperation;
    mapping(bytes32 => uint256) public operationSignatureCount;

    // ============ EVENTOS ============
    event Blacklisted(address indexed account, bool status);
    event ExcludedFromLimits(address indexed account, bool status);
    event ExcludedFromFees(address indexed account, bool status);
    event MaxTransactionAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event MaxWalletBalanceUpdated(uint256 oldAmount, uint256 newAmount);
    event TimelockInitiated(bytes32 indexed operationId, uint256 expiry);
    event TimelockExecuted(bytes32 indexed operationId);
    event SignerAdded(address indexed signer);
    event SignerRemoved(address indexed signer);
    event OperationSigned(bytes32 indexed operationId, address indexed signer);
    event EmergencyWithdraw(address indexed token, uint256 amount);

    // ============ MODIFICADORES ============
    modifier notBlacklisted(address account) {
        require(!isBlacklisted[account], "MEXI: Account is blacklisted");
        _;
    }

    modifier withinLimits(address from, address to, uint256 amount) {
        if (!isExcludedFromLimits[from] && !isExcludedFromLimits[to]) {
            require(amount <= maxTransactionAmount, "MEXI: Exceeds max transaction");
            if (!isExcludedFromLimits[to]) {
                require(
                    balanceOf(to).add(amount) <= maxWalletBalance,
                    "MEXI: Exceeds max wallet balance"
                );
            }
        }
        _;
    }

    modifier timelockPassed(bytes32 operationId) {
        require(timelockExpiry[operationId] != 0, "MEXI: Timelock not initiated");
        require(block.timestamp >= timelockExpiry[operationId], "MEXI: Timelock not expired");
        require(!timelockExecuted[operationId], "MEXI: Already executed");
        _;
    }

    modifier multiSigApproved(bytes32 operationId) {
        require(
            operationSignatureCount[operationId] >= requiredSignatures,
            "MEXI: Insufficient signatures"
        );
        _;
    }

    // ============ CONSTRUCTOR ============
    constructor(
        address[] memory _initialSigners
    ) ERC20("MexiSwap Token", "MEXI") ERC20Permit("MexiSwap Token") {
        require(_initialSigners.length >= 2, "MEXI: Need at least 2 signers");
        
        // Configurar roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(BLACKLIST_ROLE, msg.sender);

        // Configurar signers
        for (uint256 i = 0; i < _initialSigners.length; i++) {
            require(_initialSigners[i] != address(0), "MEXI: Invalid signer");
            signers.push(_initialSigners[i]);
            emit SignerAdded(_initialSigners[i]);
        }

        // Excluir owner y contrato de límites
        isExcludedFromLimits[msg.sender] = true;
        isExcludedFromLimits[address(this)] = true;
        isExcludedFromFees[msg.sender] = true;
        isExcludedFromFees[address(this)] = true;

        // Mint inicial
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    // ============ FUNCIONES ERC20 OVERRIDE ============
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal virtual override(ERC20, ERC20Votes) 
        whenNotPaused 
        notBlacklisted(from) 
        notBlacklisted(to) 
        withinLimits(from, to, amount) 
    {
        super._update(from, to, amount);
    }

    function nonces(address owner) public view virtual override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }

    // ============ FUNCIONES DE MINT ============
    function mint(address to, uint256 amount) 
        external 
        onlyRole(MINTER_ROLE) 
        nonReentrant 
    {
        require(totalSupply().add(amount) <= MAX_SUPPLY, "MEXI: Exceeds max supply");
        _mint(to, amount);
    }

    // ============ FUNCIONES DE PAUSA ============
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ============ FUNCIONES DE BLACKLIST ============
    function setBlacklist(address account, bool status) 
        external 
        onlyRole(BLACKLIST_ROLE) 
    {
        require(account != address(0), "MEXI: Invalid address");
        isBlacklisted[account] = status;
        emit Blacklisted(account, status);
    }

    function batchBlacklist(address[] calldata accounts, bool status) 
        external 
        onlyRole(BLACKLIST_ROLE) 
    {
        for (uint256 i = 0; i < accounts.length; i++) {
            isBlacklisted[accounts[i]] = status;
            emit Blacklisted(accounts[i], status);
        }
    }

    // ============ FUNCIONES DE EXCLUSIÓN ============
    function setExcludedFromLimits(address account, bool status) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        isExcludedFromLimits[account] = status;
        emit ExcludedFromLimits(account, status);
    }

    function setExcludedFromFees(address account, bool status) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        isExcludedFromFees[account] = status;
        emit ExcludedFromFees(account, status);
    }

    // ============ FUNCIONES CON TIMELOCK ============
    function initiateSetMaxTransaction(uint256 newAmount) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        bytes32 operationId = keccak256(abi.encodePacked("setMaxTransaction", newAmount, block.timestamp));
        timelockExpiry[operationId] = block.timestamp + TIMELOCK_DURATION;
        emit TimelockInitiated(operationId, timelockExpiry[operationId]);
    }

    function executeSetMaxTransaction(uint256 newAmount, bytes32 operationId) 
        external 
        onlyRole(ADMIN_ROLE) 
        timelockPassed(operationId) 
        multiSigApproved(operationId)
    {
        uint256 oldAmount = maxTransactionAmount;
        maxTransactionAmount = newAmount;
        timelockExecuted[operationId] = true;
        emit MaxTransactionAmountUpdated(oldAmount, newAmount);
        emit TimelockExecuted(operationId);
    }

    function initiateSetMaxWallet(uint256 newAmount) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        bytes32 operationId = keccak256(abi.encodePacked("setMaxWallet", newAmount, block.timestamp));
        timelockExpiry[operationId] = block.timestamp + TIMELOCK_DURATION;
        emit TimelockInitiated(operationId, timelockExpiry[operationId]);
    }

    function executeSetMaxWallet(uint256 newAmount, bytes32 operationId) 
        external 
        onlyRole(ADMIN_ROLE) 
        timelockPassed(operationId) 
        multiSigApproved(operationId)
    {
        uint256 oldAmount = maxWalletBalance;
        maxWalletBalance = newAmount;
        timelockExecuted[operationId] = true;
        emit MaxWalletBalanceUpdated(oldAmount, newAmount);
        emit TimelockExecuted(operationId);
    }

    // ============ FUNCIONES MULTI-SIG ============
    function signOperation(bytes32 operationId) external {
        require(_isSigner(msg.sender), "MEXI: Not a signer");
        require(!hasSignedOperation[operationId][msg.sender], "MEXI: Already signed");
        
        hasSignedOperation[operationId][msg.sender] = true;
        operationSignatureCount[operationId]++;
        
        emit OperationSigned(operationId, msg.sender);
    }

    function addSigner(address newSigner) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(newSigner != address(0), "MEXI: Invalid signer");
        require(!_isSigner(newSigner), "MEXI: Already a signer");
        
        signers.push(newSigner);
        emit SignerAdded(newSigner);
    }

    function removeSigner(address signer) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(signers.length > requiredSignatures, "MEXI: Cannot remove, need minimum signers");
        
        for (uint256 i = 0; i < signers.length; i++) {
            if (signers[i] == signer) {
                signers[i] = signers[signers.length - 1];
                signers.pop();
                emit SignerRemoved(signer);
                break;
            }
        }
    }

    function _isSigner(address account) internal view returns (bool) {
        for (uint256 i = 0; i < signers.length; i++) {
            if (signers[i] == account) return true;
        }
        return false;
    }

    // ============ FUNCIONES DE EMERGENCIA ============
    function emergencyWithdrawETH() 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
        nonReentrant 
    {
        uint256 balance = address(this).balance;
        require(balance > 0, "MEXI: No ETH to withdraw");
        
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "MEXI: ETH transfer failed");
        
        emit EmergencyWithdraw(address(0), balance);
    }

    function emergencyWithdrawToken(address token) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
        nonReentrant 
    {
        require(token != address(this), "MEXI: Cannot withdraw MEXI");
        
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "MEXI: No tokens to withdraw");
        
        IERC20(token).transfer(msg.sender, balance);
        emit EmergencyWithdraw(token, balance);
    }

    // ============ FUNCIONES VIEW ============
    function getSigners() external view returns (address[] memory) {
        return signers;
    }

    function getSignersCount() external view returns (uint256) {
        return signers.length;
    }

    function isOperationReady(bytes32 operationId) external view returns (bool) {
        return timelockExpiry[operationId] != 0 && 
               block.timestamp >= timelockExpiry[operationId] &&
               !timelockExecuted[operationId] &&
               operationSignatureCount[operationId] >= requiredSignatures;
    }

    // Recibir ETH
    receive() external payable {}
}

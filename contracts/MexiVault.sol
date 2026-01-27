/**
 * @title MexiVault
 * @author MexiSwap Team
 * @notice Vault para colateral de trading de perpetuos
 * @dev Almacena DAI y gestiona la liquidez para las posiciones
 */

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract MexiVault is ReentrancyGuard, Pausable, AccessControl {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // ============ ROLES ============
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PERPETUALS_ROLE = keccak256("PERPETUALS_ROLE");

    // ============ ESTADO ============
    IERC20 public immutable DAI;
    uint256 public totalDeposits;
    mapping(address => uint256) public deposits;

    // ============ EVENTOS ============
    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);

    // ============ CONSTRUCTOR ============
    constructor(address _dai) {
        require(_dai != address(0), "VAULT: Invalid DAI");
        DAI = IERC20(_dai);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // ============ FUNCIONES EXTERNAS (USUARIO) ============
    function deposit(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "VAULT: ZERO_DEPOSIT");
        DAI.safeTransferFrom(msg.sender, address(this), amount);
        deposits[msg.sender] = deposits[msg.sender].add(amount);
        totalDeposits = totalDeposits.add(amount);
        emit Deposit(msg.sender, amount);
    }

    function withdraw(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "VAULT: ZERO_WITHDRAW");
        require(deposits[msg.sender] >= amount, "VAULT: INSUFFICIENT_BALANCE");
        deposits[msg.sender] = deposits[msg.sender].sub(amount);
        totalDeposits = totalDeposits.sub(amount);
        DAI.safeTransfer(msg.sender, amount);
        emit Withdraw(msg.sender, amount);
    }

    // ============ FUNCIONES RESTRINGIDAS (PERPETUALS) ============
    function lockCollateral(address user, uint256 amount) external onlyRole(PERPETUALS_ROLE) {
        require(deposits[user] >= amount, "VAULT: INSUFFICIENT_COLLATERAL");
        // Lógica para mover el colateral a una sub-cuenta o simplemente registrarlo
    }

    function releaseCollateral(address user, uint256 amount) external onlyRole(PERPETUALS_ROLE) {
        // Lógica para devolver el colateral a la cuenta principal del usuario
    }

    function liquidate(address user, uint256 amount) external onlyRole(PERPETUALS_ROLE) {
        require(deposits[user] >= amount, "VAULT: INSUFFICIENT_COLLATERAL_FOR_LIQUIDATION");
        deposits[user] = deposits[user].sub(amount);
        totalDeposits = totalDeposits.sub(amount);
        // El colateral liquidado se transfiere al fondo de seguros o al feeDistributor
    }

    // ============ FUNCIONES DE CONFIGURACIÓN (ADMIN) ============
    function setPerpetualsContract(address _perpetuals) external onlyRole(ADMIN_ROLE) {
        grantRole(PERPETUALS_ROLE, _perpetuals);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MexiFarm
 * @author MexiSwap Team
 * @notice Sistema de farming y staking para tokens LP y MEXI
 * @dev Distribución de recompensas con boost por tiempo de bloqueo
 * 
 * SEGURIDAD IMPLEMENTADA:
 * - ReentrancyGuard: Protección contra ataques de reentrada
 * - Pausable: Capacidad de pausar en caso de emergencia
 * - AccessControl: Control de roles granular
 * - Safe Math: Operaciones matemáticas seguras
 * - Emergency Withdraw: Retiro de emergencia sin rewards
 */

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract MexiFarm is ReentrancyGuard, Pausable, AccessControl {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // ============ ROLES ============
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    // ============ CONSTANTES ============
    uint256 public constant PRECISION = 1e18;
    uint256 public constant BOOST_PRECISION = 10000;
    uint256 public constant MAX_LOCK_DURATION = 365 days;
    uint256 public constant MIN_LOCK_DURATION = 7 days;

    // ============ ESTRUCTURAS ============
    struct PoolInfo {
        IERC20 lpToken;
        uint256 allocPoint;
        uint256 lastRewardBlock;
        uint256 accMexiPerShare;
        uint256 totalStaked;
        uint256 depositFeeBP; // Basis points
        bool isActive;
    }

    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt;
        uint256 lockEndTime;
        uint256 boostMultiplier;
        uint256 lastDepositTime;
        uint256 pendingRewards;
    }

    struct LockOption {
        uint256 duration;
        uint256 boostMultiplier; // En basis points (10000 = 1x)
    }

    // ============ ESTADO ============
    IERC20 public immutable MEXI;
    
    PoolInfo[] public poolInfo;
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    
    uint256 public mexiPerBlock;
    uint256 public totalAllocPoint;
    uint256 public startBlock;
    uint256 public bonusEndBlock;
    uint256 public bonusMultiplier = 10; // 10x durante período de bonus
    
    LockOption[] public lockOptions;
    
    // Límites de seguridad
    uint256 public maxMexiPerBlock = 10 * PRECISION; // 10 MEXI max por bloque
    uint256 public maxDepositFee = 400; // 4% máximo

    // ============ EVENTOS ============
    event Deposit(address indexed user, uint256 indexed pid, uint256 amount, uint256 lockDuration);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event Harvest(address indexed user, uint256 indexed pid, uint256 amount);
    event PoolAdded(uint256 indexed pid, address lpToken, uint256 allocPoint);
    event PoolUpdated(uint256 indexed pid, uint256 allocPoint, uint256 depositFee);
    event MexiPerBlockUpdated(uint256 oldValue, uint256 newValue);
    event LockExtended(address indexed user, uint256 indexed pid, uint256 newLockEndTime);

    // ============ MODIFICADORES ============
    modifier validatePool(uint256 pid) {
        require(pid < poolInfo.length, "FARM: Pool not found");
        _;
    }

    modifier poolActive(uint256 pid) {
        require(poolInfo[pid].isActive, "FARM: Pool not active");
        _;
    }

    // ============ CONSTRUCTOR ============
    constructor(
        address _mexi,
        uint256 _mexiPerBlock,
        uint256 _startBlock,
        uint256 _bonusDuration
    ) {
        require(_mexi != address(0), "FARM: Invalid MEXI");
        require(_mexiPerBlock <= maxMexiPerBlock, "FARM: Mexi per block too high");

        MEXI = IERC20(_mexi);
        mexiPerBlock = _mexiPerBlock;
        startBlock = _startBlock;
        bonusEndBlock = _startBlock.add(_bonusDuration);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);

        // Configurar opciones de bloqueo
        lockOptions.push(LockOption(0, 10000)); // Flexible: 1x
        lockOptions.push(LockOption(30 days, 12500)); // 30 días: 1.25x
        lockOptions.push(LockOption(90 days, 17500)); // 90 días: 1.75x
        lockOptions.push(LockOption(180 days, 25000)); // 180 días: 2.5x
        lockOptions.push(LockOption(365 days, 40000)); // 365 días: 4x
    }

    // ============ FUNCIONES DE POOL ============
    function addPool(
        uint256 _allocPoint,
        address _lpToken,
        uint256 _depositFeeBP,
        bool _withUpdate
    ) external onlyRole(ADMIN_ROLE) {
        require(_lpToken != address(0), "FARM: Invalid LP token");
        require(_depositFeeBP <= maxDepositFee, "FARM: Deposit fee too high");

        if (_withUpdate) {
            massUpdatePools();
        }

        uint256 lastRewardBlock = block.number > startBlock ? block.number : startBlock;
        totalAllocPoint = totalAllocPoint.add(_allocPoint);

        poolInfo.push(PoolInfo({
            lpToken: IERC20(_lpToken),
            allocPoint: _allocPoint,
            lastRewardBlock: lastRewardBlock,
            accMexiPerShare: 0,
            totalStaked: 0,
            depositFeeBP: _depositFeeBP,
            isActive: true
        }));

        emit PoolAdded(poolInfo.length - 1, _lpToken, _allocPoint);
    }

    function setPool(
        uint256 _pid,
        uint256 _allocPoint,
        uint256 _depositFeeBP,
        bool _withUpdate
    ) external onlyRole(ADMIN_ROLE) validatePool(_pid) {
        require(_depositFeeBP <= maxDepositFee, "FARM: Deposit fee too high");

        if (_withUpdate) {
            massUpdatePools();
        }

        totalAllocPoint = totalAllocPoint.sub(poolInfo[_pid].allocPoint).add(_allocPoint);
        poolInfo[_pid].allocPoint = _allocPoint;
        poolInfo[_pid].depositFeeBP = _depositFeeBP;

        emit PoolUpdated(_pid, _allocPoint, _depositFeeBP);
    }

    function setPoolActive(uint256 _pid, bool _active) external onlyRole(ADMIN_ROLE) validatePool(_pid) {
        poolInfo[_pid].isActive = _active;
    }

    // ============ FUNCIONES DE STAKING ============
    function deposit(
        uint256 _pid,
        uint256 _amount,
        uint256 _lockOptionIndex
    ) external nonReentrant whenNotPaused validatePool(_pid) poolActive(_pid) {
        require(_lockOptionIndex < lockOptions.length, "FARM: Invalid lock option");
        
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];

        updatePool(_pid);

        // Harvest pending rewards
        if (user.amount > 0) {
            uint256 pending = _calculatePending(_pid, msg.sender);
            if (pending > 0) {
                user.pendingRewards = user.pendingRewards.add(pending);
            }
        }

        if (_amount > 0) {
            // Transferir tokens
            uint256 balanceBefore = pool.lpToken.balanceOf(address(this));
            pool.lpToken.safeTransferFrom(msg.sender, address(this), _amount);
            uint256 actualAmount = pool.lpToken.balanceOf(address(this)).sub(balanceBefore);

            // Aplicar fee de depósito
            if (pool.depositFeeBP > 0) {
                uint256 depositFee = actualAmount.mul(pool.depositFeeBP).div(BOOST_PRECISION);
                pool.lpToken.safeTransfer(address(this), depositFee); // Fee al contrato
                actualAmount = actualAmount.sub(depositFee);
            }

            user.amount = user.amount.add(actualAmount);
            pool.totalStaked = pool.totalStaked.add(actualAmount);
            user.lastDepositTime = block.timestamp;

            // Configurar bloqueo
            LockOption memory lockOption = lockOptions[_lockOptionIndex];
            if (lockOption.duration > 0) {
                uint256 newLockEnd = block.timestamp.add(lockOption.duration);
                if (newLockEnd > user.lockEndTime) {
                    user.lockEndTime = newLockEnd;
                    user.boostMultiplier = lockOption.boostMultiplier;
                }
            } else if (user.lockEndTime == 0) {
                user.boostMultiplier = lockOption.boostMultiplier;
            }
        }

        user.rewardDebt = user.amount.mul(pool.accMexiPerShare).div(PRECISION);

        emit Deposit(msg.sender, _pid, _amount, lockOptions[_lockOptionIndex].duration);
    }

    function withdraw(uint256 _pid, uint256 _amount) 
        external 
        nonReentrant 
        whenNotPaused 
        validatePool(_pid) 
    {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];

        require(user.amount >= _amount, "FARM: Insufficient balance");
        require(block.timestamp >= user.lockEndTime, "FARM: Still locked");

        updatePool(_pid);

        // Harvest pending rewards
        uint256 pending = _calculatePending(_pid, msg.sender);
        if (pending > 0 || user.pendingRewards > 0) {
            uint256 totalRewards = pending.add(user.pendingRewards);
            user.pendingRewards = 0;
            _safeMexiTransfer(msg.sender, totalRewards);
            emit Harvest(msg.sender, _pid, totalRewards);
        }

        if (_amount > 0) {
            user.amount = user.amount.sub(_amount);
            pool.totalStaked = pool.totalStaked.sub(_amount);
            pool.lpToken.safeTransfer(msg.sender, _amount);
        }

        user.rewardDebt = user.amount.mul(pool.accMexiPerShare).div(PRECISION);

        // Reset boost si se retira todo
        if (user.amount == 0) {
            user.boostMultiplier = 10000;
            user.lockEndTime = 0;
        }

        emit Withdraw(msg.sender, _pid, _amount);
    }

    function harvest(uint256 _pid) external nonReentrant whenNotPaused validatePool(_pid) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];

        updatePool(_pid);

        uint256 pending = _calculatePending(_pid, msg.sender);
        uint256 totalRewards = pending.add(user.pendingRewards);

        require(totalRewards > 0, "FARM: Nothing to harvest");

        user.pendingRewards = 0;
        user.rewardDebt = user.amount.mul(pool.accMexiPerShare).div(PRECISION);

        _safeMexiTransfer(msg.sender, totalRewards);

        emit Harvest(msg.sender, _pid, totalRewards);
    }

    function emergencyWithdraw(uint256 _pid) external nonReentrant validatePool(_pid) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];

        uint256 amount = user.amount;
        require(amount > 0, "FARM: Nothing to withdraw");

        // Penalización por retiro de emergencia durante bloqueo
        uint256 penalty = 0;
        if (block.timestamp < user.lockEndTime) {
            penalty = amount.mul(1000).div(BOOST_PRECISION); // 10% penalización
            amount = amount.sub(penalty);
        }

        user.amount = 0;
        user.rewardDebt = 0;
        user.pendingRewards = 0;
        user.lockEndTime = 0;
        user.boostMultiplier = 10000;

        pool.totalStaked = pool.totalStaked.sub(user.amount);
        pool.lpToken.safeTransfer(msg.sender, amount);

        emit EmergencyWithdraw(msg.sender, _pid, amount);
    }

    function extendLock(uint256 _pid, uint256 _lockOptionIndex) 
        external 
        nonReentrant 
        validatePool(_pid) 
    {
        require(_lockOptionIndex < lockOptions.length, "FARM: Invalid lock option");
        
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount > 0, "FARM: No stake found");

        LockOption memory lockOption = lockOptions[_lockOptionIndex];
        require(lockOption.duration > 0, "FARM: Must choose lock duration");

        uint256 newLockEnd = block.timestamp.add(lockOption.duration);
        require(newLockEnd > user.lockEndTime, "FARM: New lock must be longer");

        // Harvest antes de cambiar boost
        updatePool(_pid);
        uint256 pending = _calculatePending(_pid, msg.sender);
        if (pending > 0) {
            user.pendingRewards = user.pendingRewards.add(pending);
        }

        user.lockEndTime = newLockEnd;
        user.boostMultiplier = lockOption.boostMultiplier;
        user.rewardDebt = user.amount.mul(poolInfo[_pid].accMexiPerShare).div(PRECISION);

        emit LockExtended(msg.sender, _pid, newLockEnd);
    }

    // ============ FUNCIONES DE ACTUALIZACIÓN ============
    function updatePool(uint256 _pid) public validatePool(_pid) {
        PoolInfo storage pool = poolInfo[_pid];

        if (block.number <= pool.lastRewardBlock) {
            return;
        }

        if (pool.totalStaked == 0 || pool.allocPoint == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }

        uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
        uint256 mexiReward = multiplier.mul(mexiPerBlock).mul(pool.allocPoint).div(totalAllocPoint);

        pool.accMexiPerShare = pool.accMexiPerShare.add(
            mexiReward.mul(PRECISION).div(pool.totalStaked)
        );
        pool.lastRewardBlock = block.number;
    }

    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    // ============ FUNCIONES INTERNAS ============
    function _calculatePending(uint256 _pid, address _user) internal view returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];

        uint256 accMexiPerShare = pool.accMexiPerShare;

        if (block.number > pool.lastRewardBlock && pool.totalStaked != 0) {
            uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
            uint256 mexiReward = multiplier.mul(mexiPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
            accMexiPerShare = accMexiPerShare.add(mexiReward.mul(PRECISION).div(pool.totalStaked));
        }

        uint256 pending = user.amount.mul(accMexiPerShare).div(PRECISION).sub(user.rewardDebt);
        
        // Aplicar boost
        pending = pending.mul(user.boostMultiplier).div(BOOST_PRECISION);

        return pending;
    }

    function _safeMexiTransfer(address _to, uint256 _amount) internal {
        uint256 mexiBal = MEXI.balanceOf(address(this));
        if (_amount > mexiBal) {
            MEXI.safeTransfer(_to, mexiBal);
        } else {
            MEXI.safeTransfer(_to, _amount);
        }
    }

    // ============ FUNCIONES VIEW ============
    function getMultiplier(uint256 _from, uint256 _to) public view returns (uint256) {
        if (_to <= bonusEndBlock) {
            return _to.sub(_from).mul(bonusMultiplier);
        } else if (_from >= bonusEndBlock) {
            return _to.sub(_from);
        } else {
            return bonusEndBlock.sub(_from).mul(bonusMultiplier).add(_to.sub(bonusEndBlock));
        }
    }

    function pendingMexi(uint256 _pid, address _user) external view returns (uint256) {
        UserInfo storage user = userInfo[_pid][_user];
        return _calculatePending(_pid, _user).add(user.pendingRewards);
    }

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    function getUserInfo(uint256 _pid, address _user) external view returns (UserInfo memory) {
        return userInfo[_pid][_user];
    }

    function getPoolInfo(uint256 _pid) external view returns (PoolInfo memory) {
        return poolInfo[_pid];
    }

    function getLockOptions() external view returns (LockOption[] memory) {
        return lockOptions;
    }

    function getAPR(uint256 _pid) external view returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        if (pool.totalStaked == 0) return 0;

        uint256 blocksPerYear = 2628000; // ~1 bloque cada 12 segundos
        uint256 mexiRewardPerYear = mexiPerBlock.mul(blocksPerYear).mul(pool.allocPoint).div(totalAllocPoint);
        
        // Asumiendo precio de MEXI = $1 para simplificar
        return mexiRewardPerYear.mul(10000).div(pool.totalStaked);
    }

    // ============ FUNCIONES ADMIN ============
    function setMexiPerBlock(uint256 _mexiPerBlock) external onlyRole(ADMIN_ROLE) {
        require(_mexiPerBlock <= maxMexiPerBlock, "FARM: Too high");
        massUpdatePools();
        
        emit MexiPerBlockUpdated(mexiPerBlock, _mexiPerBlock);
        mexiPerBlock = _mexiPerBlock;
    }

    function setBonusMultiplier(uint256 _multiplier) external onlyRole(ADMIN_ROLE) {
        require(_multiplier <= 20, "FARM: Multiplier too high");
        bonusMultiplier = _multiplier;
    }

    function setBonusEndBlock(uint256 _bonusEndBlock) external onlyRole(ADMIN_ROLE) {
        bonusEndBlock = _bonusEndBlock;
    }

    function addLockOption(uint256 _duration, uint256 _boostMultiplier) external onlyRole(ADMIN_ROLE) {
        require(_duration <= MAX_LOCK_DURATION, "FARM: Duration too long");
        require(_boostMultiplier >= BOOST_PRECISION, "FARM: Multiplier too low");
        lockOptions.push(LockOption(_duration, _boostMultiplier));
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // Función de emergencia
    function emergencyMexiWithdraw(uint256 _amount) external onlyRole(ADMIN_ROLE) {
        MEXI.safeTransfer(msg.sender, _amount);
    }
}

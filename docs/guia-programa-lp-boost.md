# Guía Técnica de Implementación: Programa LP Boost

## MexiSwap - Estrategia de Migración de Liquidez

**Versión:** 1.0  
**Fecha:** Enero 2026  
**Autor:** Equipo MexiSwap  
**Red:** Polygon Mainnet

---

## Resumen Ejecutivo

El **Programa LP Boost** de MexiSwap representa una estrategia innovadora de adquisición de liquidez diseñada para atraer proveedores de liquidez de otros DEX mediante incentivos superiores y una experiencia de migración sin fricción.

Esta guía técnica detalla el proceso completo de implementación, desde la arquitectura de contratos inteligentes hasta las estrategias de marketing y retención de liquidez.

La estrategia se fundamenta en tres pilares principales: **incentivos superiores** para proveedores de liquidez, **migración sin fricción** de posiciones existentes, y un **programa de recompensas retroactivas** que reconoce la participación histórica en otros DEX.

---

## 1. Arquitectura de Contratos Inteligentes

### 1.1 Contrato MexiMigrator

El contrato `MexiMigrator` es el núcleo de la estrategia de migración. Permite a los usuarios migrar sus tokens LP de otros DEX (Uniswap, SushiSwap, QuickSwap) a MexiSwap en una sola transacción.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IUniswapV2Router {
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB);
}

interface IMexiRouter {
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity);
}

contract MexiMigrator is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    // Routers de DEX soportados
    mapping(address => bool) public supportedRouters;
    
    // Router de MexiSwap
    IMexiRouter public mexiRouter;
    
    // Token MEXI para bonificaciones
    IERC20 public mexiToken;
    
    // Porcentaje de bonificación (10% = 1000 basis points)
    uint256 public bonusPercentage = 1000;
    
    // Gas subsidiado (50%)
    uint256 public gasSubsidy = 50;
    
    // Período de bonificación activo
    bool public bonusPeriodActive = true;
    
    // Eventos
    event LiquidityMigrated(
        address indexed user,
        address indexed sourceRouter,
        address tokenA,
        address tokenB,
        uint256 lpAmountIn,
        uint256 lpAmountOut,
        uint256 bonusAmount
    );
    
    constructor(
        address _mexiRouter,
        address _mexiToken
    ) {
        mexiRouter = IMexiRouter(_mexiRouter);
        mexiToken = IERC20(_mexiToken);
    }
    
    /**
     * @notice Migra liquidez de otro DEX a MexiSwap
     * @param sourceRouter Router del DEX origen
     * @param lpToken Token LP a migrar
     * @param tokenA Primer token del par
     * @param tokenB Segundo token del par
     * @param lpAmount Cantidad de LP tokens a migrar
     * @param amountAMin Mínimo de tokenA aceptable
     * @param amountBMin Mínimo de tokenB aceptable
     * @param deadline Timestamp límite para la transacción
     */
    function migrate(
        address sourceRouter,
        address lpToken,
        address tokenA,
        address tokenB,
        uint256 lpAmount,
        uint256 amountAMin,
        uint256 amountBMin,
        uint256 deadline
    ) external nonReentrant returns (uint256 newLpAmount, uint256 bonusAmount) {
        require(supportedRouters[sourceRouter], "Router no soportado");
        require(lpAmount > 0, "Cantidad debe ser mayor a 0");
        
        // 1. Transferir LP tokens del usuario
        IERC20(lpToken).safeTransferFrom(msg.sender, address(this), lpAmount);
        
        // 2. Aprobar router origen para quemar LP
        IERC20(lpToken).safeApprove(sourceRouter, lpAmount);
        
        // 3. Remover liquidez del DEX origen
        (uint256 amountA, uint256 amountB) = IUniswapV2Router(sourceRouter)
            .removeLiquidity(
                tokenA,
                tokenB,
                lpAmount,
                amountAMin,
                amountBMin,
                address(this),
                deadline
            );
        
        // 4. Aprobar tokens para MexiSwap
        IERC20(tokenA).safeApprove(address(mexiRouter), amountA);
        IERC20(tokenB).safeApprove(address(mexiRouter), amountB);
        
        // 5. Agregar liquidez a MexiSwap
        (, , newLpAmount) = mexiRouter.addLiquidity(
            tokenA,
            tokenB,
            amountA,
            amountB,
            amountAMin,
            amountBMin,
            msg.sender,
            deadline
        );
        
        // 6. Calcular y enviar bonificación en MEXI
        if (bonusPeriodActive) {
            // Calcular valor USD de la liquidez migrada
            uint256 liquidityValueUSD = _calculateLiquidityValue(
                tokenA, 
                tokenB, 
                amountA, 
                amountB
            );
            
            // 10% de bonificación en tokens MEXI
            bonusAmount = (liquidityValueUSD * bonusPercentage) / 10000;
            
            if (bonusAmount > 0 && mexiToken.balanceOf(address(this)) >= bonusAmount) {
                mexiToken.safeTransfer(msg.sender, bonusAmount);
            }
        }
        
        emit LiquidityMigrated(
            msg.sender,
            sourceRouter,
            tokenA,
            tokenB,
            lpAmount,
            newLpAmount,
            bonusAmount
        );
        
        return (newLpAmount, bonusAmount);
    }
    
    /**
     * @notice Calcula el valor en USD de la liquidez
     */
    function _calculateLiquidityValue(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB
    ) internal view returns (uint256) {
        // Implementar integración con oracle de precios (Chainlink)
        // Por simplicidad, retornamos un valor estimado
        return amountA + amountB; // Placeholder
    }
    
    // Funciones administrativas
    function addSupportedRouter(address router) external onlyOwner {
        supportedRouters[router] = true;
    }
    
    function setBonusPercentage(uint256 _percentage) external onlyOwner {
        require(_percentage <= 2000, "Max 20%");
        bonusPercentage = _percentage;
    }
    
    function toggleBonusPeriod() external onlyOwner {
        bonusPeriodActive = !bonusPeriodActive;
    }
}
```

### 1.2 Contrato MexiMasterChef

El contrato `MexiMasterChef` gestiona la distribución de recompensas MEXI a los proveedores de liquidez.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MexiMasterChef is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    // Info de cada usuario
    struct UserInfo {
        uint256 amount;         // LP tokens depositados
        uint256 rewardDebt;     // Recompensas ya contabilizadas
        uint256 boostMultiplier; // Multiplicador por staking de MEXI
        uint256 migrationBonus;  // Bonus por migración
    }
    
    // Info de cada pool
    struct PoolInfo {
        IERC20 lpToken;           // Dirección del LP token
        uint256 allocPoint;       // Puntos de asignación
        uint256 lastRewardBlock;  // Último bloque con recompensas
        uint256 accMexiPerShare;  // MEXI acumulado por share
        uint256 totalStaked;      // Total LP stakeado
        bool isBoostPool;         // Pool con bonus de migración
    }
    
    // Token MEXI
    IERC20 public mexi;
    
    // MEXI por bloque
    uint256 public mexiPerBlock;
    
    // Multiplicador de bonus inicial (10x durante 2 semanas)
    uint256 public bonusMultiplier = 10;
    uint256 public bonusEndBlock;
    
    // Info de pools
    PoolInfo[] public poolInfo;
    
    // Info de usuarios por pool
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    
    // Total de puntos de asignación
    uint256 public totalAllocPoint;
    
    // Bloque de inicio
    uint256 public startBlock;
    
    // Eventos
    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event Harvest(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);
    
    constructor(
        IERC20 _mexi,
        uint256 _mexiPerBlock,
        uint256 _startBlock,
        uint256 _bonusDuration
    ) {
        mexi = _mexi;
        mexiPerBlock = _mexiPerBlock;
        startBlock = _startBlock;
        bonusEndBlock = _startBlock + _bonusDuration;
    }
    
    /**
     * @notice Agrega un nuevo pool de farming
     */
    function add(
        uint256 _allocPoint,
        IERC20 _lpToken,
        bool _isBoostPool,
        bool _withUpdate
    ) external onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        
        uint256 lastRewardBlock = block.number > startBlock ? block.number : startBlock;
        totalAllocPoint += _allocPoint;
        
        poolInfo.push(PoolInfo({
            lpToken: _lpToken,
            allocPoint: _allocPoint,
            lastRewardBlock: lastRewardBlock,
            accMexiPerShare: 0,
            totalStaked: 0,
            isBoostPool: _isBoostPool
        }));
    }
    
    /**
     * @notice Calcula el multiplicador de recompensas
     */
    function getMultiplier(uint256 _from, uint256 _to) public view returns (uint256) {
        if (_to <= bonusEndBlock) {
            return (_to - _from) * bonusMultiplier;
        } else if (_from >= bonusEndBlock) {
            return _to - _from;
        } else {
            return ((bonusEndBlock - _from) * bonusMultiplier) + (_to - bonusEndBlock);
        }
    }
    
    /**
     * @notice Actualiza las recompensas de todos los pools
     */
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }
    
    /**
     * @notice Actualiza las recompensas de un pool específico
     */
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        
        if (pool.totalStaked == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        
        uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
        uint256 mexiReward = (multiplier * mexiPerBlock * pool.allocPoint) / totalAllocPoint;
        
        pool.accMexiPerShare += (mexiReward * 1e12) / pool.totalStaked;
        pool.lastRewardBlock = block.number;
    }
    
    /**
     * @notice Deposita LP tokens para farming
     */
    function deposit(uint256 _pid, uint256 _amount) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        updatePool(_pid);
        
        // Harvest recompensas pendientes
        if (user.amount > 0) {
            uint256 pending = _calculatePending(pool, user);
            if (pending > 0) {
                safeMexiTransfer(msg.sender, pending);
            }
        }
        
        if (_amount > 0) {
            pool.lpToken.safeTransferFrom(msg.sender, address(this), _amount);
            user.amount += _amount;
            pool.totalStaked += _amount;
        }
        
        user.rewardDebt = (user.amount * pool.accMexiPerShare) / 1e12;
        
        emit Deposit(msg.sender, _pid, _amount);
    }
    
    /**
     * @notice Retira LP tokens del farming
     */
    function withdraw(uint256 _pid, uint256 _amount) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        require(user.amount >= _amount, "Cantidad insuficiente");
        
        updatePool(_pid);
        
        uint256 pending = _calculatePending(pool, user);
        if (pending > 0) {
            safeMexiTransfer(msg.sender, pending);
        }
        
        if (_amount > 0) {
            user.amount -= _amount;
            pool.totalStaked -= _amount;
            pool.lpToken.safeTransfer(msg.sender, _amount);
        }
        
        user.rewardDebt = (user.amount * pool.accMexiPerShare) / 1e12;
        
        emit Withdraw(msg.sender, _pid, _amount);
    }
    
    /**
     * @notice Calcula recompensas pendientes
     */
    function _calculatePending(
        PoolInfo storage pool,
        UserInfo storage user
    ) internal view returns (uint256) {
        uint256 accMexiPerShare = pool.accMexiPerShare;
        uint256 pending = ((user.amount * accMexiPerShare) / 1e12) - user.rewardDebt;
        
        // Aplicar multiplicador de boost si existe
        if (user.boostMultiplier > 0) {
            pending = (pending * user.boostMultiplier) / 100;
        }
        
        return pending;
    }
    
    /**
     * @notice Transferencia segura de MEXI
     */
    function safeMexiTransfer(address _to, uint256 _amount) internal {
        uint256 mexiBal = mexi.balanceOf(address(this));
        if (_amount > mexiBal) {
            mexi.safeTransfer(_to, mexiBal);
        } else {
            mexi.safeTransfer(_to, _amount);
        }
    }
    
    /**
     * @notice Retiro de emergencia sin recompensas
     */
    function emergencyWithdraw(uint256 _pid) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        uint256 amount = user.amount;
        user.amount = 0;
        user.rewardDebt = 0;
        pool.totalStaked -= amount;
        
        pool.lpToken.safeTransfer(msg.sender, amount);
        
        emit EmergencyWithdraw(msg.sender, _pid, amount);
    }
}
```

### 1.3 Contrato MexiToken

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MexiToken is ERC20, ERC20Burnable, Ownable {
    // Suministro máximo: 1 billón de tokens
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;
    
    // Direcciones con permisos de mint
    mapping(address => bool) public minters;
    
    // Eventos
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    
    constructor() ERC20("MexiSwap Token", "MEXI") {
        // Mint inicial para distribución
        _mint(msg.sender, 100_000_000 * 10**18); // 10% inicial
    }
    
    modifier onlyMinter() {
        require(minters[msg.sender] || msg.sender == owner(), "No autorizado");
        _;
    }
    
    function mint(address to, uint256 amount) external onlyMinter {
        require(totalSupply() + amount <= MAX_SUPPLY, "Excede suministro maximo");
        _mint(to, amount);
    }
    
    function addMinter(address minter) external onlyOwner {
        minters[minter] = true;
        emit MinterAdded(minter);
    }
    
    function removeMinter(address minter) external onlyOwner {
        minters[minter] = false;
        emit MinterRemoved(minter);
    }
}
```

---

## 2. Cronograma de Implementación

### Fase 1: Pre-Lanzamiento (Semanas 1-2)

| Tarea | Descripción | Duración |
|-------|-------------|----------|
| Auditoría de contratos | Revisión por firma externa (CertiK, Trail of Bits) | 5-7 días |
| Deploy en testnet | Pruebas en Polygon Mumbai | 3 días |
| Integración frontend | Conectar UI con contratos | 4 días |
| Marketing inicial | Anuncio en redes sociales, partnerships | Continuo |

### Fase 2: Lanzamiento (Semana 3)

| Día | Actividad |
|-----|-----------|
| Día 1 | Deploy de contratos en Polygon Mainnet |
| Día 1 | Activación del período de bonus 10x |
| Día 1 | Apertura de migración desde Uniswap/SushiSwap/QuickSwap |
| Día 2 | Inicio del airdrop retroactivo |
| Día 3-7 | Monitoreo intensivo y ajustes |

### Fase 3: Consolidación (Semanas 4-8)

| Semana | Objetivo |
|--------|----------|
| 4 | Reducción gradual del multiplicador (10x → 5x) |
| 5 | Lanzamiento de gobernanza DAO |
| 6 | Activación de staking de MEXI |
| 7 | Reducción a multiplicador 2x |
| 8 | Transición a emisiones normales |

---

## 3. Estrategia de Incentivos

### 3.1 Estructura de Recompensas

La distribución de tokens MEXI sigue un modelo de emisión decreciente diseñado para maximizar la atracción inicial de liquidez mientras se mantiene la sostenibilidad a largo plazo.

| Período | Emisión por bloque | Multiplicador | MEXI/día estimado |
|---------|-------------------|---------------|-------------------|
| Semanas 1-2 | 10 MEXI | 10x | 1,200,000 |
| Semanas 3-4 | 10 MEXI | 5x | 600,000 |
| Semanas 5-8 | 10 MEXI | 2x | 240,000 |
| Mes 3+ | 5 MEXI | 1x | 60,000 |

### 3.2 Bonificaciones por Migración

Los usuarios que migren liquidez de otros DEX reciben beneficios adicionales:

1. **Bonus del 10% en MEXI**: Por cada $100 USD migrados, el usuario recibe $10 en tokens MEXI
2. **Gas subsidiado al 50%**: El protocolo reembolsa la mitad del gas utilizado
3. **Boost de farming 1.5x**: Durante 30 días, las recompensas de farming son 50% mayores
4. **NFT conmemorativo**: Badge exclusivo para early adopters

### 3.3 Airdrop Retroactivo

Para maximizar el impacto del programa de migración, se implementa un airdrop retroactivo basado en la actividad histórica:

| Criterio | Asignación MEXI |
|----------|-----------------|
| LP en Uniswap V2/V3 (últimos 6 meses) | 500-5,000 MEXI |
| LP en SushiSwap (últimos 6 meses) | 500-5,000 MEXI |
| LP en QuickSwap (últimos 6 meses) | 500-5,000 MEXI |
| Volumen de trading > $10,000 | 200 MEXI adicionales |
| Holder de tokens de gobernanza (UNI, SUSHI) | 100 MEXI adicionales |

---

## 4. Integración Técnica

### 4.1 Configuración del Frontend

```typescript
// config/contracts.ts
export const CONTRACTS = {
  MEXI_TOKEN: "0x1234567890ABCDEF1234567890ABCDEF12345678",
  MEXI_ROUTER: "0x2345678901BCDEF02345678901BCDEF023456789",
  MEXI_FACTORY: "0x3456789012CDEF013456789012CDEF0134567890",
  MEXI_MIGRATOR: "0x4567890123DEF0124567890123DEF01245678901",
  MEXI_MASTERCHEF: "0x5678901234EF01235678901234EF012356789012",
};

export const SUPPORTED_ROUTERS = {
  UNISWAP_V2: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  SUSHISWAP: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
  QUICKSWAP: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff",
};

export const CHAIN_CONFIG = {
  chainId: 137,
  chainName: "Polygon Mainnet",
  rpcUrl: "https://polygon-rpc.com",
  blockExplorer: "https://polygonscan.com",
};
```

### 4.2 Hook de Migración

```typescript
// hooks/useMigration.ts
import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACTS, SUPPORTED_ROUTERS } from "@/config/contracts";
import MexiMigratorABI from "@/abis/MexiMigrator.json";

export function useMigration() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const migrate = useCallback(async (
    sourceRouter: string,
    lpToken: string,
    tokenA: string,
    tokenB: string,
    lpAmount: string,
    slippage: number = 0.5
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const migrator = new ethers.Contract(
        CONTRACTS.MEXI_MIGRATOR,
        MexiMigratorABI,
        signer
      );

      // Calcular mínimos con slippage
      const amountAMin = ethers.parseUnits(
        (parseFloat(lpAmount) * (1 - slippage / 100)).toString(),
        18
      );
      const amountBMin = amountAMin;

      // Deadline: 20 minutos
      const deadline = Math.floor(Date.now() / 1000) + 1200;

      // Aprobar LP tokens
      const lpContract = new ethers.Contract(
        lpToken,
        ["function approve(address,uint256) returns (bool)"],
        signer
      );
      
      const approveTx = await lpContract.approve(
        CONTRACTS.MEXI_MIGRATOR,
        ethers.parseUnits(lpAmount, 18)
      );
      await approveTx.wait();

      // Ejecutar migración
      const tx = await migrator.migrate(
        sourceRouter,
        lpToken,
        tokenA,
        tokenB,
        ethers.parseUnits(lpAmount, 18),
        amountAMin,
        amountBMin,
        deadline
      );

      const receipt = await tx.wait();
      
      return {
        success: true,
        txHash: receipt.hash,
      };
    } catch (err: any) {
      setError(err.message || "Error en la migración");
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { migrate, isLoading, error };
}
```

---

## 5. Seguridad y Auditoría

### 5.1 Consideraciones de Seguridad

| Riesgo | Mitigación |
|--------|------------|
| Reentrancy attacks | Uso de `ReentrancyGuard` de OpenZeppelin |
| Flash loan attacks | Verificación de balances antes/después |
| Oracle manipulation | Uso de Chainlink para precios |
| Admin key compromise | Multisig 3/5 para funciones críticas |
| Smart contract bugs | Auditoría externa + bug bounty |

### 5.2 Programa de Bug Bounty

| Severidad | Recompensa |
|-----------|------------|
| Crítica (pérdida de fondos) | $50,000 - $100,000 |
| Alta (manipulación de estado) | $10,000 - $50,000 |
| Media (DoS, griefing) | $2,000 - $10,000 |
| Baja (mejoras de gas) | $500 - $2,000 |

---

## 6. Métricas de Éxito

### 6.1 KPIs Principales

| Métrica | Objetivo Semana 1 | Objetivo Mes 1 |
|---------|-------------------|----------------|
| TVL Total | $50M | $150M |
| Liquidez migrada | $30M | $80M |
| Usuarios únicos | 5,000 | 25,000 |
| Volumen diario | $5M | $15M |
| Holders de MEXI | 10,000 | 50,000 |

### 6.2 Monitoreo en Tiempo Real

```typescript
// Dashboard de métricas
const METRICS_ENDPOINTS = {
  tvl: "/api/metrics/tvl",
  volume: "/api/metrics/volume",
  migrations: "/api/metrics/migrations",
  users: "/api/metrics/users",
};

// Alertas automáticas
const ALERTS = {
  tvlDrop: { threshold: -10, action: "notify_team" },
  highSlippage: { threshold: 5, action: "pause_pool" },
  unusualActivity: { threshold: 100, action: "review" },
};
```

---

## 7. Conclusión

El Programa LP Boost de MexiSwap representa una estrategia competitiva y sostenible para atraer liquidez del ecosistema DeFi en Polygon. A través de incentivos superiores, una experiencia de usuario optimizada y un programa de recompensas retroactivas, MexiSwap está posicionado para convertirse en el DEX líder de la red.

La clave del éxito radica en la ejecución impecable durante las primeras semanas, cuando los multiplicadores de recompensas son más altos y la atención del mercado está en su punto máximo.

---

## Referencias

- [Uniswap V2 Documentation](https://docs.uniswap.org/contracts/v2/overview)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Polygon Documentation](https://docs.polygon.technology/)
- [Chainlink Price Feeds](https://docs.chain.link/data-feeds)

# MexiSwap Smart Contracts

## Contratos Inteligentes con Seguridad Extrema

Este directorio contiene todos los contratos inteligentes del protocolo MexiSwap, diseñados con múltiples capas de seguridad.

---

## 📦 Contratos Principales

| Contrato | Descripción | Seguridad |
|----------|-------------|-----------|
| `MexiToken.sol` | Token ERC-20 nativo MEXI | ReentrancyGuard, Pausable, AccessControl, Anti-whale |
| `MexiSwapRouter.sol` | Router del DEX para swaps | ReentrancyGuard, Pausable, Deadline, Slippage Protection |
| `MexiPerpetuals.sol` | Trading de perpetuos 100x | ReentrancyGuard, Pausable, Oracle Integration, Liquidation Engine |
| `MexiLaunchpad.sol` | Plataforma de ICO | ReentrancyGuard, Pausable, KYC, Whitelist, Vesting, Anti-bot |
| `GMXMigrator.sol` | Migración desde GMX | ReentrancyGuard, Pausable, Signature Verification, Rate Limiting |
| `MexiFarm.sol` | Farming y staking | ReentrancyGuard, Pausable, Lock Mechanism, Boost System |
| `FeeDistributor.sol` | Distribución de comisiones | ReentrancyGuard, Pausable, Epoch System, Snapshot |

---

## 🔒 Medidas de Seguridad Implementadas

### 1. Protección contra Reentrancy
Todos los contratos implementan `ReentrancyGuard` de OpenZeppelin para prevenir ataques de reentrada.

### 2. Sistema de Pausado
Capacidad de pausar operaciones en caso de emergencia detectada.

### 3. Control de Acceso Granular
- `DEFAULT_ADMIN_ROLE`: Control total
- `ADMIN_ROLE`: Configuración de parámetros
- `OPERATOR_ROLE`: Operaciones diarias
- `SIGNER_ROLE`: Verificación de firmas

### 4. Protecciones Específicas
- **Anti-whale**: Límites de transacción y holding
- **Anti-bot**: Delay entre transacciones
- **Deadline**: Protección contra transacciones pendientes
- **Slippage**: Protección contra manipulación de precios
- **Rate Limiting**: Límites de operaciones por período

---

## 🚀 Despliegue en Mumbai Testnet

### Requisitos Previos

```bash
# Instalar dependencias
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts
```

### Configuración de Hardhat

```javascript
// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    mumbai: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 80001
    },
    polygon: {
      url: "https://polygon-rpc.com",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 137
    },
    bsc: {
      url: "https://bsc-dataseed.binance.org",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 56
    },
    ethereum: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 1
    },
    avalanche: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 43114
    }
  },
  etherscan: {
    apiKey: {
      polygonMumbai: process.env.POLYGONSCAN_API_KEY,
      polygon: process.env.POLYGONSCAN_API_KEY,
      bsc: process.env.BSCSCAN_API_KEY,
      mainnet: process.env.ETHERSCAN_API_KEY,
      avalanche: process.env.SNOWTRACE_API_KEY
    }
  }
};
```

### Script de Despliegue

```javascript
// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // 1. Deploy MexiToken
  const MexiToken = await hre.ethers.getContractFactory("MexiToken");
  const mexi = await MexiToken.deploy();
  await mexi.waitForDeployment();
  console.log("MexiToken deployed to:", await mexi.getAddress());

  // 2. Deploy FeeDistributor
  const FeeDistributor = await hre.ethers.getContractFactory("FeeDistributor");
  const DAI_ADDRESS = "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063"; // DAI en Polygon
  const feeDistributor = await FeeDistributor.deploy(DAI_ADDRESS, await mexi.getAddress());
  await feeDistributor.waitForDeployment();
  console.log("FeeDistributor deployed to:", await feeDistributor.getAddress());

  // 3. Deploy MexiSwapRouter
  const MexiSwapRouter = await hre.ethers.getContractFactory("MexiSwapRouter");
  const FACTORY_ADDRESS = "0x..."; // Tu factory address
  const WETH_ADDRESS = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"; // WMATIC en Polygon
  const router = await MexiSwapRouter.deploy(
    FACTORY_ADDRESS,
    WETH_ADDRESS,
    await feeDistributor.getAddress()
  );
  await router.waitForDeployment();
  console.log("MexiSwapRouter deployed to:", await router.getAddress());

  // 4. Deploy MexiPerpetuals
  const MexiPerpetuals = await hre.ethers.getContractFactory("MexiPerpetuals");
  const CHAINLINK_ORACLE = "0x..."; // Chainlink price feed
  const perpetuals = await MexiPerpetuals.deploy(
    DAI_ADDRESS,
    await mexi.getAddress(),
    CHAINLINK_ORACLE,
    await feeDistributor.getAddress()
  );
  await perpetuals.waitForDeployment();
  console.log("MexiPerpetuals deployed to:", await perpetuals.getAddress());

  // 5. Deploy MexiLaunchpad
  const MexiLaunchpad = await hre.ethers.getContractFactory("MexiLaunchpad");
  const launchpad = await MexiLaunchpad.deploy(
    DAI_ADDRESS,
    await mexi.getAddress(),
    await feeDistributor.getAddress()
  );
  await launchpad.waitForDeployment();
  console.log("MexiLaunchpad deployed to:", await launchpad.getAddress());

  // 6. Deploy GMXMigrator
  const GMXMigrator = await hre.ethers.getContractFactory("GMXMigrator");
  const startTime = Math.floor(Date.now() / 1000) + 86400; // Mañana
  const duration = 14 * 24 * 60 * 60; // 14 días
  const mexiBudget = hre.ethers.parseEther("10000000"); // 10M MEXI
  const migrator = await GMXMigrator.deploy(
    DAI_ADDRESS,
    await mexi.getAddress(),
    startTime,
    duration,
    mexiBudget
  );
  await migrator.waitForDeployment();
  console.log("GMXMigrator deployed to:", await migrator.getAddress());

  // 7. Deploy MexiFarm
  const MexiFarm = await hre.ethers.getContractFactory("MexiFarm");
  const mexiPerBlock = hre.ethers.parseEther("1"); // 1 MEXI por bloque
  const startBlock = await hre.ethers.provider.getBlockNumber() + 100;
  const bonusDuration = 100000; // ~2 semanas
  const farm = await MexiFarm.deploy(
    await mexi.getAddress(),
    mexiPerBlock,
    startBlock,
    bonusDuration
  );
  await farm.waitForDeployment();
  console.log("MexiFarm deployed to:", await farm.getAddress());

  // Registrar productos en FeeDistributor
  await feeDistributor.registerProduct(await router.getAddress());
  await feeDistributor.registerProduct(await perpetuals.getAddress());
  await feeDistributor.registerProduct(await launchpad.getAddress());
  console.log("Products registered in FeeDistributor");

  console.log("\n=== DEPLOYMENT COMPLETE ===");
  console.log({
    MexiToken: await mexi.getAddress(),
    FeeDistributor: await feeDistributor.getAddress(),
    MexiSwapRouter: await router.getAddress(),
    MexiPerpetuals: await perpetuals.getAddress(),
    MexiLaunchpad: await launchpad.getAddress(),
    GMXMigrator: await migrator.getAddress(),
    MexiFarm: await farm.getAddress()
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### Comandos de Despliegue

```bash
# Mumbai Testnet
npx hardhat run scripts/deploy.js --network mumbai

# Polygon Mainnet
npx hardhat run scripts/deploy.js --network polygon

# Verificar contratos
npx hardhat verify --network mumbai <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

---

## 🔐 Variables de Entorno

Crear archivo `.env`:

```env
PRIVATE_KEY=tu_private_key_aqui
POLYGONSCAN_API_KEY=tu_api_key
BSCSCAN_API_KEY=tu_api_key
ETHERSCAN_API_KEY=tu_api_key
SNOWTRACE_API_KEY=tu_api_key
INFURA_KEY=tu_infura_key
```

---

## 📊 Direcciones de Tokens por Red

### DAI (Colateral)
| Red | Dirección |
|-----|-----------|
| Polygon | `0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063` |
| Ethereum | `0x6B175474E89094C44Da98b954EescdeCB5BAA9d` |
| BNB Chain | `0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3` |
| Avalanche | `0xd586E7F844cEa2F87f50152665BCbc2C279D8d70` |

### WETH/WMATIC/WBNB
| Red | Dirección |
|-----|-----------|
| Polygon (WMATIC) | `0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270` |
| Ethereum (WETH) | `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` |
| BNB Chain (WBNB) | `0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c` |
| Avalanche (WAVAX) | `0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7` |

---

## ⚠️ Consideraciones de Seguridad

1. **Auditoría**: Se recomienda auditoría por CertiK, Trail of Bits o similar antes de mainnet
2. **Bug Bounty**: Implementar programa de bug bounty
3. **Multisig**: Usar Gnosis Safe para roles admin
4. **Timelock**: Agregar timelock para cambios críticos
5. **Monitoreo**: Implementar alertas con Tenderly o similar

---

## 📞 Soporte

- Discord: https://discord.gg/mexiswap
- Twitter: https://twitter.com/mexiswap
- Email: security@mexiswap.io

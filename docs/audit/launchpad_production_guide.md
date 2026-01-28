# Guía Técnica: Puesta en Producción del Launchpad de MexiSwap

**Autor:** Manus AI
**Fecha:** 26 de enero de 2026
**Advertencia:** Esta guía omite el paso de auditoría de seguridad externa, que es **crítico y altamente recomendado** antes de manejar fondos reales de usuarios.

---

## Resumen

Esta guía proporciona los pasos técnicos necesarios para llevar la sección **Launchpad** desde su estado actual (UI con datos simulados) a un estado funcional y listo para producción en la blockchain. El proceso se divide en tres fases principales:

1.  **Despliegue de Contratos:** Poner los contratos inteligentes en una red real (Testnet primero, luego Mainnet).
2.  **Integración del Frontend:** Conectar la interfaz de usuario con los contratos desplegados para leer y escribir datos en la blockchain.
3.  **Configuración Operativa:** Establecer los roles, automatizaciones y servicios necesarios para la operación diaria del Launchpad.

---

## Fase 1: Despliegue de Contratos Inteligentes

**Objetivo:** Desplegar `MexiLaunchpad.sol` y sus dependencias en una red y obtener sus direcciones.

### Paso 1.1: Configurar el Entorno de Desarrollo de Contratos

El proyecto carece de un framework de desarrollo de contratos. Se recomienda usar **Hardhat**.

1.  **Instalar Hardhat y dependencias:**
    ```bash
    cd /home/ubuntu/mexi-swap-repo
    pnpm add -D hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/hardhat-upgrades
    ```
2.  **Inicializar Hardhat:**
    Crea un archivo `hardhat.config.js` en la raíz del proyecto con la configuración para la red objetivo (ej. Polygon).

### Paso 1.2: Crear el Script de Despliegue

Crea un script en `scripts/deploy-launchpad.js` para desplegar los contratos en el orden correcto.

```javascript
// scripts/deploy-launchpad.js
const { ethers } = require('hardhat');

async function main() {
  // 1. Desplegar dependencias (DAI y MEXI si no existen en la red)
  const DAI = await ethers.deployContract('MockERC20', ['Dai Stablecoin', 'DAI', 18]);
  await DAI.waitForDeployment();
  console.log(`DAI desplegado en: ${DAI.target}`);

  const MEXI = await ethers.deployContract('MexiToken'); // Asumiendo que MexiToken es tu contrato
  await MEXI.waitForDeployment();
  console.log(`MexiToken desplegado en: ${MEXI.target}`);

  // 2. Desplegar el FeeDistributor (si es un contrato separado)
  const FeeDistributor = await ethers.deployContract('FeeDistributor');
  await FeeDistributor.waitForDeployment();
  console.log(`FeeDistributor desplegado en: ${FeeDistributor.target}`);

  // 3. Desplegar el Launchpad
  const MexiLaunchpad = await ethers.deployContract('MexiLaunchpad', [
    DAI.target,
    MEXI.target,
    FeeDistributor.target
  ]);
  await MexiLaunchpad.waitForDeployment();
  console.log(`MexiLaunchpad desplegado en: ${MexiLaunchpad.target}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
```

### Paso 1.3: Desplegar en Testnet y Actualizar Direcciones

1.  **Ejecutar el despliegue** en una red de prueba como Polygon Mumbai:
    ```bash
    npx hardhat run scripts/deploy-launchpad.js --network mumbai
    ```
2.  **Copiar las direcciones** de los contratos que se muestran en la consola.
3.  **Actualizar el archivo de configuración** del frontend en `client/src/config/chains.ts` con las nuevas direcciones:

    ```typescript
    // client/src/config/chains.ts
    // ...
    contracts: {
      dai: '0x...<Dirección_DAI_Desplegada>',
      router: '...',
      perpetuals: '...',
      factory: '...',
      masterChef: '...',
      launchpad: '0x...<Dirección_Launchpad_Desplegada>',
      governance: '...',
    },
    // ...
    ```

---

## Fase 2: Integración del Frontend (Web3)

**Objetivo:** Reemplazar los datos simulados (`MOCK_PROJECTS`) con datos reales del contrato inteligente.

### Paso 2.1: Crear el Hook `useLaunchpad`

Crea un nuevo archivo `client/src/hooks/useLaunchpad.ts`. Este hook centralizará toda la lógica de interacción con el contrato `MexiLaunchpad`.

```typescript
// client/src/hooks/useLaunchpad.ts
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '@/contexts/Web3Context';
import { getChainConfig } from '@/config/chains';
import MexiLaunchpadABI from '@/contracts/MexiLaunchpad.json'; // Necesitas el ABI del contrato

export function useLaunchpad() {
  const { provider, signer, chainId } = useWeb3();
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  useEffect(() => {
    if (provider && chainId) {
      const config = getChainConfig(chainId);
      if (config?.contracts.launchpad) {
        const launchpadContract = new ethers.Contract(
          config.contracts.launchpad,
          MexiLaunchpadABI.abi,
          signer || provider
        );
        setContract(launchpadContract);
      }
    }
  }, [provider, signer, chainId]);

  // --- Funciones de Lectura ---
  const getSales = useCallback(async () => {
    if (!contract) return [];
    // Lógica para llamar a la función del contrato que devuelve las ventas
    // y transformar los datos para la UI.
  }, [contract]);

  // --- Funciones de Escritura ---
  const purchaseTokens = useCallback(async (saleId: number, amount: string) => {
    if (!contract || !signer) throw new Error('Wallet no conectada');
    const tx = await contract.purchase(saleId, ethers.parseEther(amount));
    await tx.wait();
  }, [contract, signer]);

  return { contract, getSales, purchaseTokens };
}
```

### Paso 2.2: Integrar el Hook en el Componente `Launchpad.tsx`

1.  **Eliminar `MOCK_PROJECTS`:** Borra o comenta el array de datos de ejemplo.
2.  **Llamar al Hook:** Importa y utiliza `useLaunchpad`.
3.  **Cargar Datos Reales:** Usa `useEffect` para llamar a la función `getSales` del hook y poblar el estado de los proyectos.

    ```tsx
    // client/src/pages/Launchpad.tsx
    import { useLaunchpad } from '@/hooks/useLaunchpad';

    export default function Launchpad() {
      const { getSales, purchaseTokens } = useLaunchpad();
      const [projects, setProjects] = useState<ICOProject[]>([]);

      useEffect(() => {
        async function loadSales() {
          const salesFromChain = await getSales();
          setProjects(salesFromChain);
        }
        loadSales();
      }, [getSales]);

      const handlePurchase = async () => {
        // ... validaciones ...
        await purchaseTokens(selectedProject.id, purchaseAmount);
        // ... actualizar UI ...
      };

      // ... resto del componente usando `projects` ...
    }
    ```

---

## Fase 3: Configuración Operativa

**Objetivo:** Configurar los aspectos administrativos y de automatización para el funcionamiento del Launchpad.

### Paso 3.1: Administración de Roles

El contrato tiene roles (`ADMIN_ROLE`, `OPERATOR_ROLE`, `KYC_VERIFIER_ROLE`). Es **fundamental** que estos roles no sean controlados por una sola cuenta personal (EOA).

- **Acción:** Asigna estos roles a una **wallet multi-sig** (como Gnosis Safe) para requerir múltiples aprobaciones para acciones críticas (ej. pausar el contrato, cambiar fees).

### Paso 3.2: Servicio de Whitelist (Merkle Tree)

Para las ventas que requieran whitelist, necesitas un servicio de backend que:

1.  Almacene la lista de direcciones autorizadas.
2.  Genere un **Merkle Root** a partir de esa lista.
3.  El admin suba este *root* al contrato usando la función `updateWhitelistMerkleRoot`.
4.  Provea a cada usuario whitelisteado su **Merkle Proof** para que pueda enviarlo en la transacción de compra.

### Paso 3.3: Automatización de Fases de Venta

El contrato no avanza de fase automáticamente (ej. de `Presale` a `PublicSale`).

- **Acción:** Implementa un **bot de backend** o usa un servicio como **Chainlink Keepers** para monitorear el `block.timestamp` y llamar a las funciones de cambio de fase (`startPublicSale`, `finalizeSale`) en el momento exacto.

---

## Conclusión

Una vez completadas estas tres fases, el Launchpad será funcionalmente robusto y estará listo para ser desplegado en la red principal (Mainnet). El paso final, y más importante, sería realizar una **auditoría de seguridad completa** antes de anunciar el lanzamiento al público.

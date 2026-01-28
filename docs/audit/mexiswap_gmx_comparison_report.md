# Comparativa Técnica: MexiSwap vs. GMX en Operaciones de Perpetuos

## Introducción

El proyecto MexiSwap ha sido diseñado con una arquitectura de trading de perpetuos inspirada en el modelo de Exchange Descentralizado (DEX) de GMX, un líder en el sector de derivados descentralizados [1]. Esta comparativa se centra en el funcionamiento de las operaciones de perpetuos, analizando las similitudes y diferencias clave en el flujo de trading, el modelo de liquidez y la gestión de riesgos.

## 1. Flujo de Trading de Perpetuos

El flujo de trading en MexiSwap, tal como está implementado en el contrato `MexiPerpetuals.sol`, es altamente similar al de GMX, centrándose en la apertura, cierre y liquidación de posiciones.

### Apertura de Posición (`openPosition`)

| Característica | MexiSwap (`MexiPerpetuals.sol`) | GMX (Modelo V2) | Similitud |
| :--- | :--- | :--- | :--- |
| **Colateral** | Se requiere un token de colateral (ej. DAI) que se transfiere al contrato. | Se requiere un token de colateral (ej. ETH, BTC, USDC) que se deposita en el Vault (GLP/GM Pool). | **Alta.** Ambos usan un token de colateral para abrir la posición. |
| **Cálculo de Tamaño** | `size = collateral * leverage` | `size = collateral * leverage` | **Alta.** El cálculo del tamaño de la posición es idéntico. |
| **Oráculo de Precios** | **Pyth Network** (Integrado para baja latencia). | **Chainlink Data Streams** (Principal) y **Pyth Network** (Respaldo/Específico). | **Alta.** Ambos utilizan oráculos de baja latencia para precios de ejecución. |
| **Cálculo de Liquidación** | Se calcula el precio de liquidación en el momento de la apertura. | Se calcula el precio de liquidación en el momento de la apertura. | **Alta.** Mecanismo de riesgo estándar. |
| **Fees** | Se cobra un `TRADING_FEE` sobre el tamaño de la posición. | Se cobra un *Execution Fee* y un *Dynamic Fee* sobre el tamaño de la posición. | **Media.** Ambos cobran fees sobre el tamaño, pero GMX tiene una estructura de fees más dinámica. |

### Cierre y Liquidación de Posición

El mecanismo de PnL (Ganancia y Pérdida) y liquidación sigue el modelo de GMX, donde el PnL se calcula en relación con el precio de entrada y el precio actual del activo.

*   **Cálculo de PnL:** En ambos sistemas, el PnL se calcula como la diferencia entre el precio de entrada y el precio de salida, multiplicado por el tamaño de la posición, y ajustado por el *Funding Rate* acumulado.
*   **Liquidación:** La liquidación se activa cuando el precio del activo alcanza el precio de liquidación precalculado. En MexiSwap, el rol `LIQUIDATOR_ROLE` puede ejecutar la función `liquidatePosition`, un patrón de *keeper* idéntico al de GMX.

## 2. Modelo de Liquidez y Gestión de Riesgos

Aquí es donde reside la mayor similitud y la principal diferencia estructural con el modelo de GMX.

### Modelo de Liquidez (CRÍTICO)

| Característica | MexiSwap (Diseño Actual) | GMX (Modelo V2) | Similitud |
| :--- | :--- | :--- | :--- |
| **Fuente de Liquidez** | **Vault Único (`MexiVault.sol`)** para colateral (DAI). | **Pool de Liquidez Único (GM Pool)** compuesto por múltiples activos (ETH, BTC, USDC, etc.). | **Alta.** Ambos utilizan un modelo de liquidez centralizada (Pool Único) en lugar de pares AMM tradicionales. |
| **Token de Liquidez** | No definido explícitamente, pero se asume un token de LP (ej. `MLP`). | **GM Token** (antes GLP), que representa la participación en el pool de liquidez. | **Alta.** El modelo de Pool Único requiere un token de LP para representar la propiedad. |
| **Contraparte** | Los traders operan contra el `MexiVault`. | Los traders operan contra el **GM Pool**. | **Alta.** El PnL de los traders es la ganancia/pérdida del Pool, y viceversa. |

El modelo de Pool Único es la característica definitoria que hace que MexiSwap sea un clon funcional de GMX. Este modelo ofrece **cero deslizamiento (zero slippage)** para los traders, ya que la liquidez es profunda y se basa en el precio del oráculo, no en la profundidad del libro de órdenes.

### Gestión de Riesgos

El contrato `MexiPerpetuals.sol` incluye mecanismos de seguridad avanzados que reflejan la madurez de GMX:

1.  **Circuit Breaker:** MexiSwap incluye un `CIRCUIT_BREAKER_THRESHOLD` (10% de movimiento en 1 hora) que, al igual que GMX, puede pausar el trading de un activo para prevenir manipulaciones o pérdidas extremas durante eventos de alta volatilidad.
2.  **Límites de Posición:** Se definen límites de `maxPositionSize` y `maxUserPositions` para limitar la exposición del `MexiVault` a un solo trader o posición.
3.  **Funding Rate:** El `Funding Rate` se calcula y aplica para equilibrar el *Open Interest* (OI) entre longs y shorts, un mecanismo esencial para la estabilidad de cualquier DEX de perpetuos.

## Conclusión

El funcionamiento de los perpetuos en MexiSwap es **extremadamente parecido** al de GMX. El proyecto replica la arquitectura central de GMX:

*   **Modelo de Liquidez:** Pool Único (Vault) como contraparte.
*   **Ejecución:** Basada en oráculos de baja latencia (Pyth).
*   **Gestión de Riesgos:** Circuit Breakers, límites de OI y Funding Rates.

La principal diferencia radica en que MexiSwap utiliza un diseño de contratos más modular (ej. `MexiVault.sol` separado para el colateral), pero la lógica subyacente es la misma.

En resumen, si el usuario está familiarizado con la operación de GMX, encontrará el flujo de trading de MexiSwap intuitivo y técnicamente similar, con la ventaja de la integración de Pyth Network para una ejecución de precios de alta calidad.

---
## Referencias

[1] [GMX Documentation - Perpetual Trading](https://gmx.io/docs/trading)
[2] [Pyth Network Documentation - Pyth Price Feeds](https://docs.pyth.network/price-feeds/overview)
[3] [Solidity Contract: MexiPerpetuals.sol](file:///home/ubuntu/mexi-swap-repo/contracts/MexiPerpetuals.sol)
[4] [Solidity Contract: MexiVault.sol](file:///home/ubuntu/mexi-swap-repo/contracts/MexiVault.sol)

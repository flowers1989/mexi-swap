# Guía de Usuario del Launchpad de MexiSwap

Bienvenido al Launchpad de MexiSwap, la plataforma de lanzamiento de tokens de próxima generación con seguridad y transparencia de nivel institucional. Esta guía le proporcionará los pasos necesarios para participar en las ventas de tokens (ICO/IDO) de forma segura y eficiente.

## 1. Requisitos Previos

Para participar en cualquier venta de tokens en el Launchpad de MexiSwap, necesitará:

1.  **Una Wallet Compatible:** MetaMask, WalletConnect, o cualquier otra wallet compatible con EVM.
2.  **Conexión a la Red:** Asegúrese de estar conectado a la red **Polygon Mainnet** (o la red especificada por el proyecto).
3.  **Tokens de Pago:** Necesitará el token de pago aceptado (generalmente **DAI** o **USDC**) para realizar su compra.

## 2. Acceso y Conexión

1.  **Acceda al Launchpad:** Navegue a la sección "Launchpad" en la barra de navegación de MexiSwap.
2.  **Conecte su Wallet:** Haga clic en el botón "Conectar Wallet" en la esquina superior derecha. Siga las instrucciones de su proveedor de wallet para autorizar la conexión.

## 3. Participación en una Venta de Tokens

### 3.1. Selección del Proyecto

1.  **Explore los Proyectos:** La página principal muestra todos los proyectos disponibles, filtrados por estado:
    *   **Activo:** Venta en curso.
    *   **Próximo:** Venta anunciada, pero aún no ha comenzado.
    *   **Finalizado:** Venta que ha concluido (exitosa o fallida).
2.  **Revise los Detalles:** Haga clic en un proyecto para ver su ficha completa, que incluye:
    *   **Precio del Token:** Costo del token en la moneda de pago (ej. $0.05 DAI).
    *   **Hard Cap:** Monto máximo de recaudación.
    *   **Vesting:** Detalles sobre el calendario de liberación de tokens.
    *   **Requisitos:** Verifique si el proyecto requiere **Whitelist** o **KYC**.

### 3.2. Proceso de Compra

1.  **Verifique la Whitelist/KYC:** Si el proyecto requiere Whitelist, asegúrese de que su dirección de wallet haya sido incluida antes de intentar comprar.
2.  **Ingrese el Monto:** En la sección de compra, ingrese la cantidad de tokens de pago (ej. DAI) que desea invertir.
    *   El sistema le mostrará automáticamente cuántos tokens del proyecto recibirá.
    *   Asegúrese de que el monto esté entre el **Mínimo de Compra** y el **Máximo de Compra** del proyecto.
3.  **Apruebe el Gasto (Aprobación ERC-20):** Si es su primera vez usando el token de pago en el Launchpad, deberá hacer clic en "Aprobar" y confirmar la transacción en su wallet. Esto permite que el contrato del Launchpad gaste sus tokens.
4.  **Confirme la Compra:** Una vez aprobado, haga clic en el botón "Comprar Tokens" y confirme la transacción final en su wallet.

Una vez confirmada la transacción, su asignación de tokens se registrará en el contrato inteligente.

## 4. Reclamo de Tokens (Vesting)

MexiSwap utiliza un sistema de **Vesting** para la liberación gradual de tokens, protegiendo la economía del proyecto.

1.  **TGE (Token Generation Event):** Un porcentaje de sus tokens (ej. 25%) se liberará inmediatamente después del evento de generación de tokens.
2.  **Cliff:** El "cliff" es un período de espera (ej. 30 días) antes de que comience la liberación gradual.
3.  **Reclamo:** En la ficha del proyecto, navegue a la pestaña "Mis Asignaciones".
    *   El sistema mostrará la cantidad de tokens que tiene **disponibles para reclamar**.
    *   Haga clic en el botón **"Reclamar Tokens"** y confirme la transacción.
4.  **Calendario:** El resto de sus tokens se liberará de forma lineal durante el **Período de Vesting** (ej. 180 días). Podrá reclamar sus tokens en cualquier momento después del cliff.

## 5. Soporte y Seguridad

*   **Seguridad:** El Launchpad opera con contratos auditados (una vez que se complete la auditoría formal) y utiliza un **Timelock** para proteger los fondos.
*   **Ayuda:** Si tiene problemas con una transacción o un reclamo, verifique el estado de la red y el gas. Si el problema persiste, contacte al equipo de soporte de MexiSwap a través de los canales oficiales.
*   **Transparencia:** Todas las transacciones y el estado de los proyectos son públicos y verificables en la blockchain.

# Fondo Común (Monad)

Fondo Común es una aplicación web que permite a grupos de personas (amigos, compañeros de oficina, etc.) juntar dinero en un pozo compartido, guardarlo en dólares digitales (USDC) en la red Monad y gestionar los gastos grupales mediante un sistema de votación onchain, sin que los usuarios finales necesiten saber de criptomonedas ni pagar comisiones (gas).

## Requisitos Previos

Para levantar este proyecto localmente, necesitas:
- **Node.js** (v18 o superior) y **npm**.
- Una base de datos **PostgreSQL** (puedes crear una gratis en [Neon.tech](https://neon.tech)).
- Una cuenta en **Privy** ([privy.io](https://privy.io)) para la autenticación y creación de billeteras invisibles (Embedded Wallets).
- Una **wallet de desarrollo** (ej. MetaMask) con acceso a la red de pruebas de Monad (Monad Testnet). Necesitarás tener tokens MON de prueba (para el gas del relayer) y tokens USDC (o un token ERC20 simulado) en esa wallet.

## Guía de Instalación Paso a Paso

El proyecto está dividido en tres partes fundamentales que deben levantarse en orden: Contratos, Backend y Frontend.

### 1. Smart Contracts (`contracts/`)

Primero debes desplegar el contrato fábrica (Factory) a la red Monad, o correr un nodo local.

```bash
cd contracts
npm install
```

**Configuración del `.env` (en `contracts/.env`):**
Crea un archivo `.env` basándote en el ejemplo, con lo siguiente:
- `PRIVATE_KEY`: La clave privada de tu wallet de desarrollo (con la que harás el deploy). Exórtala desde tu MetaMask o wallet de preferencia.
- `MONAD_RPC_URL`: La URL del RPC de Monad Testnet (ej. `https://testnet-rpc.monad.xyz/`).

**Despliegue y Pruebas:**
```bash
# Para correr los tests de los contratos localmente
npx hardhat test

# Para compilar los contratos
npx hardhat compile

# Para hacer el deploy a Monad Testnet (o red local)
# (Revisa los scripts en la carpeta scripts/ para el comando exacto de deploy)
npx hardhat run scripts/deploy.ts --network monadTestnet
```
*Toma nota de la dirección del contrato `SharedWalletFactory` desplegado y del token `USDC` de prueba, los necesitarás para el backend.*

### 2. Backend (`backend/`)

El backend maneja la lógica de negocio, la base de datos y actúa como "Relayer" pagando el gas de las transacciones.

```bash
cd backend
npm install
```

**Configuración del `.env` (en `backend/.env`):**
- `DATABASE_URL`: La cadena de conexión a tu PostgreSQL. Obténla del panel de Neon.tech.
- `PRIVY_APP_ID` y `PRIVY_APP_SECRET`: Credenciales de tu app en Privy. Las consigues en el dashboard de Privy (Config > App Settings).
- `MONAD_RPC_URL`: El RPC de Monad (ej. `https://testnet-rpc.monad.xyz/`).
- `RELAYER_PRIVATE_KEY`: Clave privada de la wallet que usará el backend para pagar el gas de todas las transacciones. **DEBE tener fondos (MON) en la Testnet.**
- `FACTORY_CONTRACT_ADDRESS`: La dirección del `SharedWalletFactory` obtenida en el paso 1.
- `MONAD_USDC_ADDRESS`: La dirección del token USDC en Monad Testnet.
- `DEMO_FIAT_TO_USD_RATE`: (Opcional) Valor por defecto para conversión, ej. `0.001`.

**Levantar el servidor:**
```bash
npm run start:dev
```
*El servidor correrá en `http://localhost:3000`.*

### 3. Frontend (`frontend/`)

La aplicación web con la que interactúa el usuario final.

```bash
cd frontend
npm install
```

**Configuración del `.env` (en `frontend/.env`):**
- `VITE_PRIVY_APP_ID`: Tu App ID de Privy (el mismo usado en el backend).
- `VITE_API_URL`: URL del backend (ej. `http://localhost:3000`).

**Levantar la aplicación:**
```bash
npm run dev
```
*La app estará disponible en `http://localhost:5173`.*

## Deploy a Producción

El deploy a producción actualmente **se encuentra pendiente de documentación completa**. A grandes rasgos se requeriría:
- Base de datos productiva (Supabase/Neon).
- Hosting del backend (Render, Railway, AWS) asegurando de exponer los puertos de WebSocket e inyectar el `.env`.
- Hosting del frontend (Vercel, Netlify) configurando los dominios autorizados en Privy.
- Fondos reales en la wallet del Relayer en la Mainnet de Monad.

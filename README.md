# 🚀 Fondo Común en Monad

¡Bienvenido a **Fondo Común**! La plataforma definitiva de finanzas sociales colaborativas impulsada por la altísima velocidad y seguridad de **Monad**.

Fondo Común elimina la fricción de organizar viajes, eventos o fondos familiares. Reemplazamos la necesidad de una cuenta bancaria centralizada (donde una sola persona tiene todo el riesgo y control) por un sistema transparente basado en **Contratos Inteligentes**, en el que todos los miembros deciden y auditan los gastos.

## ✨ Características Principales

- **Velocidad Extrema (El Efecto Wow):** Aprovechando la finalidad casi instantánea de Monad, los depósitos, creaciones de grupos y votaciones tardan fracciones de segundo. La red es tan rápida que casi no notarás que estás usando una blockchain.
- **Fricción Cero con Web3:** Integramos **Privy** para que cualquier usuario, sin necesidad de conocimientos previos sobre criptomonedas o billeteras, pueda unirse usando simplemente su cuenta de Google o Apple.
- **Transacciones Sin Gas para el Usuario:** Gracias a nuestro modelo **Relayer** (Meta-transacciones mediante EIP-712), nuestro servidor asume los costos transaccionales. Los usuarios solo "firman" su intención con un clic, eliminando la barrera de entrada.
- **Consenso Social Seguro:** Nadie puede retirar dinero de forma arbitraria. Cada egreso es una "solicitud de gasto" que debe ser votada y aprobada por los miembros del grupo.
- **Notificaciones en Tiempo Real:** Interfaz viva mediante WebSockets. Los nuevos depósitos o gastos se actualizan en pantalla automáticamente.

## 🛠️ Arquitectura Técnica

- **Blockchain:** Monad Testnet (Alto Rendimiento)
- **Contratos Inteligentes:** Solidity (Gestión descentralizada de fondos)
- **Autenticación y Wallets:** Privy (Embedded Wallets)
- **Frontend:** React + Vite (UX Moderna e instantánea)
- **Backend:** NestJS + PostgreSQL + WebSockets + Ethers.js (Actúa como API, Notificador en tiempo real y Relayer)

## 🚀 Correr el Proyecto Localmente

Si deseas probar el proyecto completo (Frontend + Backend) en tu máquina local, sigue estos pasos:

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/fondo-comun-monad.git
cd fondo-comun-monad
```

### 2. Levantar el Backend (NestJS)
El backend requiere una base de datos PostgreSQL local y acceso a Privy y a Monad RPC.

```bash
cd backend
npm install

# Configura tus variables de entorno (.env) usando .env.example como base
# Necesitarás tu PRIVY_APP_ID, PRIVY_APP_SECRET, RPC de Monad y tu Private Key del Relayer.
npm run start:dev
```
El servidor backend estará corriendo en `http://localhost:3000`.

### 3. Levantar el Frontend (React/Vite)
Abre otra pestaña en tu terminal y corre:

```bash
cd frontend
npm install

# Configura el .env local con tus variables VITE_PRIVY_APP_ID y VITE_API_URL
npm run dev
```
La aplicación web estará lista en `http://localhost:5173`.

---

*Fondo Común es un proyecto desarrollado orgullosamente para el **Monad Metropolis Hackathon** (Track: Consumer Products & Payments).*

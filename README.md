# Fondo Común (Monad)

Fondo Común es una aplicación web diseñada para resolver un problema cotidiano: juntar dinero entre varias personas de manera segura y transparente. 

Ya sea para organizar un viaje entre amigos, un asado el fin de semana o manejar los gastos de una oficina, lo normal es que una sola persona reciba todo el dinero en su cuenta bancaria. Esto suele generar dudas, falta de transparencia (los demás no saben cuánto hay ni en qué se gastó exactamente) y le pone toda la responsabilidad a esa única persona.

Esta aplicación soluciona el problema usando contratos inteligentes en la red Monad. El dinero no lo tiene una persona, sino un contrato inmutable donde todos los miembros del grupo pueden ver el saldo, proponer gastos y votar si aprueban o rechazan el uso de los fondos.

## ¿Cómo funciona?

### 1. Dinero Estable (USDC)
Para evitar la volatilidad de las criptomonedas (no queremos que el fondo para las pizzas valga un 20% menos al día siguiente), el contrato maneja los saldos en **USDC**, una moneda que mantiene paridad con el dólar. 

### 2. Cero barreras técnicas (El Relayer)
Para que cualquier persona pueda usar la aplicación sin saber qué es la blockchain, usamos un sistema de billeteras invisibles (vía Privy) y un backend que actúa como **Relayer**. 
El usuario solo inicia sesión con su correo. Cuando quiere depositar, proponer un gasto o votar, simplemente "firma" una orden. El backend toma esa orden y paga el costo de la transacción (gas) en la red Monad. El usuario final vive una experiencia idéntica a una app tradicional, pero respaldada por la seguridad de la blockchain.

### 3. Votaciones Dinámicas
El sistema protege el dinero mediante reglas estrictas de votación, que varían según el tamaño del grupo:
- **1 persona:** Se aprueba todo automáticamente.
- **2 personas:** Se necesita 1 voto (el de la persona que no propuso el gasto).
- **3 o más personas:** Se requiere mayoría de votos. Quien pide el dinero no puede votar por su propio pedido.

### 4. Tiempo Real
El frontend está conectado al backend mediante WebSockets. Cuando alguien vota o se hace un movimiento de dinero, todos los miembros del grupo ven el impacto en pantalla al instante, sin recargar la página.

## Roles del Grupo
- **Administrador (Creador):** Es quien arma el grupo y define el límite de crédito general y diario inicial. 
- **Invitado:** Se une al grupo mediante invitación, aporta dinero y puede solicitar o votar gastos, al igual que el administrador.

## Tecnologías Utilizadas
- **Blockchain:** Monad Testnet
- **Contratos:** Solidity
- **Frontend:** React + Vite
- **Backend:** NestJS + PostgreSQL + WebSockets + Ethers.js
- **Autenticación:** Privy (Embedded Wallets)

## Cómo correr el proyecto localmente

### Backend (NestJS)
Necesitas una base de datos PostgreSQL y las credenciales de Privy y Monad RPC.
```bash
cd backend
npm install
# Completar el archivo .env basándote en .env.example
npm run start:dev
```
El servidor escuchará en `http://localhost:3000`.

### Frontend (React/Vite)
Abre otra terminal:
```bash
cd frontend
npm install
# Completar el .env con VITE_PRIVY_APP_ID y VITE_API_URL
npm run dev
```
La aplicación estará en `http://localhost:5173`.

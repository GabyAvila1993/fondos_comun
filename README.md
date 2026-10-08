# Fondo Común
**Billeteras Grupales Descentralizadas sin Fricción**

Fondo Común es una app web que armé para que grupos de personas (amigos, familias o compañeros de laburo) puedan juntar plata en un pozo compartido de forma totalmente transparente y segura. La plata se guarda en dólares digitales (USDC) usando la velocidad de la red **Monad**, y cualquier gasto que quieran hacer se decide entre todos a través de un sistema de votaciones on-chain.

¿Cuál es la magia de esto? **Nadie necesita saber absolutamente nada de criptomonedas ni pagar gas**. La app se encarga de esconder toda esa complejidad técnica mediante Account Abstraction y un sistema de Relayer. El usuario siente que está usando una app normal.

---

## 🏛️ Área del Jurado: Cómo probar la Demo
Para los jueces de Monad Metropolis, les preparé un entorno de prueba para que no tengan que configurar nada desde cero.

**Enlace a la Demo (Video Pitch de 2 mins):** [VIDEO_LINK_AQUI]

**Paso a paso para jugar con las votaciones On-Chain:**
1. Entren a la app web. Tienen dos formas de iniciar sesión:
   - **Con su propia Wallet:** Hagan clic en "Ingresar a la App" y elijan "Continue with a wallet" (MetaMask).
   - **Con cuentas de prueba (Sin Wallet):** Pueden usar cualquiera de estos correos. Privy les va a generar una billetera invisible (Embedded Wallet) sin pedirles contraseñas ni gas.
     - **Juez 1:** Email: `test-7216@privy.io` | OTP: `196682`
     - **Juez 2:** Email: `test-7971@privy.io` | OTP: `776622`
     - **Juez 3:** Email: `test-1428@privy.io` | OTP: `425212`

2. Vayan a la pestaña "Unirse" y peguen este ID de grupo de prueba: `[ID_DEL_GRUPO]`.
3. Para ver la magia de verdad: abran una ventana de incógnito, conecten una **segunda cuenta** (con otro correo de la lista), únanse con el mismo ID, y prueben proponer un gasto o cambiar un límite. Van a ver cómo los dos usuarios interactúan para aprobar las cosas 100% on-chain firmando mensajes (EIP-712).

---

## ¿Qué problema venimos a solucionar?
Siempre que armamos algo grupal y hay que poner plata (un viaje, una cena, juntar para la oficina), pasa lo mismo: uno presta su cuenta de banco y todos le transfieren ahí. A partir de ese momento, arrancan los problemas:
- **Falta de transparencia:** Los demás no ven cuánta plata hay en la cuenta de esa persona ni en qué se va gastando.
- **Riesgo centralizado:** Si el que guarda la plata tiene un problema con el banco o le bloquean la cuenta, todo el grupo la pasa mal.
- **Roce y desconfianza:** El administrador tiene que andar rindiendo cuentas a mano cada vez que paga algo.

Con Fondo Común, la plata no la tiene una persona en su banco, la custodia un **Contrato Inteligente** inviolable. Las reglas de cómo se gasta están grabadas en el código y todos tienen voz y voto.

---

## Funcionalidades y Arquitectura Técnica
El proyecto sigue el modelo de "Screaming Architecture", donde separé todo por dominio de negocio (Backend en NestJS, Frontend en React+Vite, y Smart Contracts en Hardhat).

- **Registro Fricción Cero (Privy):** La gente entra solo con su correo (con un código OTP) y se les crea una billetera integrada invisible. Cero dolores de cabeza con frases semilla.
- **Transacciones Gasless (Relayer):** El backend funciona como un Relayer. El usuario firma intenciones (EIP-712) gratis en su navegador, y mi backend recibe eso y paga el gas (MON) en la red Monad para mandar la transacción on-chain. El usuario final no gasta un solo centavo de gas.
- **Manejo en Dólares (USDC):** Protegemos los ahorros del grupo contra la inflación poniéndolo en USDC. Hasta armé una simulación donde el usuario deposita en moneda local (fiat) y la app consulta APIs de mercado en tiempo real para inyectar los USDC equivalentes.
- **Democracia Pura (Quórum):** Si alguien quiere hacer un retiro que supera los límites, se va a votación. Regla de **Mayoría Absoluta** (>50% de los miembros). En grupos de a 2, requiere el 100% de acuerdo. 1 persona = 1 voto.
- **Todo en Tiempo Real:** Le metí WebSockets aislados. Si alguien deposita o propone un gasto, las notificaciones saltan al instante *solo* en las pantallas de ese grupo.
- **Autonomía Total:** El creador del grupo puede proponer cambiar los límites de plata o disolver el contrato, siempre y cuando el grupo lo apruebe.

---

## Guía para levantar el proyecto localmente
Si te quieres bajar el repositorio y hacerlo correr en tu máquina, estos son los pasos:

### Qué necesitas tener instalado
1. Node.js (versión 18 para arriba).
2. Una base de datos PostgreSQL (yo usé una gratis de Neon.tech).
3. Hacerte una cuenta en [Privy.io](https://privy.io) para sacar un App ID y App Secret.
4. Una wallet de desarrollo (MetaMask) conectada a **Monad Testnet** con tokens MON para que el Relayer tenga saldo para pagar el gas.

### 1. Levantar los Smart Contracts
Acá viven las reglas del juego (carpeta `contracts`).
```bash
cd contracts
npm install
```
Créate un archivo `.env` adentro de la carpeta contracts con esto:
```env
PRIVATE_KEY=La_Clave_Privada_De_Tu_Metamask
MONAD_RPC_URL=https://testnet-rpc.monad.xyz/
```
Compilalos y subilos a Monad:
```bash
npx hardhat compile
npx hardhat run scripts/deploy.ts --network monadTestnet
```
*(Anotate la dirección del `SharedWalletFactory` y del `USDC` que te va a tirar la consola, los vas a necesitar).*

### 2. Levantar el Backend
El motorcito REST y WebSockets que paga el gas y coordina todo.
```bash
cd backend
npm install
```
Armá tu `.env` ahí:
```env
DATABASE_URL=Tu_URL_de_PostgreSQL
PRIVY_APP_ID=Tu_Privy_App_ID
PRIVY_APP_SECRET=Tu_Privy_Secret
MONAD_RPC_URL=https://testnet-rpc.monad.xyz/
RELAYER_PRIVATE_KEY=Clave_Privada_Del_Relayer_Que_Paga_El_Gas
FACTORY_CONTRACT_ADDRESS=Address_Del_Factory
MONAD_USDC_ADDRESS=Address_Del_USDC
DEMO_FIAT_TO_USD_RATE=0.001
```
Levantalo:
```bash
npm run start:dev
```

### 3. Levantar el Frontend
La interfaz visual (React + Vite).
```bash
cd frontend
npm install
```
El `.env` del frontend:
```env
VITE_PRIVY_APP_ID=Tu_Privy_App_ID
VITE_API_URL=http://localhost:3000
```
Y lo corres con:
```bash
npm run dev
```

---

### Declaración de Uso de Inteligencia Artificial (Hackathon Rules)
Para cumplir con el Tip 10 de Monad Metropolis, quiero aclarar que me apoyé en herramientas de IA (LLMs) durante el desarrollo de la app. Las usé más que nada como asistente de programación para armar bases de componentes, resolver bugs rápido (debugging) y ajustar detalles visuales de la interfaz. Más allá de esa ayuda técnica, toda la idea del producto, la arquitectura descentralizada (el modelo Gasless con Relayer) y las reglas matemáticas detrás de las votaciones y seguridad son creación exclusiva y original mía.
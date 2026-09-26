# Fondo Común

Billetera compartida para gastos en grupo (viajes, comidas, familia) con
límites de gasto por persona y aprobación por mayoría — corriendo de
verdad sobre **Monad**, pero con una experiencia de usuario idéntica a
cualquier billetera virtual: login con Google, balance en pesos, sin
wallets, sin gas, sin jerga cripto.

Construido para **Metropolis** (hackathon de Monad), Track 02 — *Consumer
Products & Payments*, que menciona explícitamente *"shared wallets and
group spending that settle up without an intermediary"*.

## El problema

Cuando un grupo de amigos o una familia comparte gastos (un viaje, un
fondo común de la casa), hoy se resuelve con una planilla, un grupo de
WhatsApp y mucha confianza. No hay reglas que se cumplan solas: cualquiera
puede gastar de más, nadie audita nada, y las cuentas se hacen "a ojo" al
final.

## La solución

- Cada integrante tiene un **límite por transferencia** y una **cantidad
  de transferencias diarias** sin necesidad de pedir permiso.
- Superar ese límite (o pedir un monto mayor) dispara una **solicitud que
  necesita mayoría de votos** del grupo para ejecutarse.
- Todo esto son **reglas de un smart contract**, no una promesa de la app:
  ni siquiera los administradores de la plataforma pueden saltárselas.
- El usuario final **nunca ve nada de esto**. Se loguea con Google, ve su
  saldo en pesos, deposita, gasta y vota con botones normales.

## Por qué esto es honesto sobre lo que es demo y lo que es real

- ✅ **Real, corriendo en Monad Testnet**: el contrato `SharedWallet.sol`
  (límites, votación, altas de miembros, firmas EIP-712 verificadas
  onchain) y sus tests (`contracts/test/`).
- ✅ **Real**: el fondo se guarda en **USDC** (el stablecoin de Circle, ya
  activo en Monad), no en MON nativo — así el saldo en pesos del grupo no
  fluctúa con el precio de mercado de la criptomoneda. MON se usa
  únicamente para pagar el gas de las transacciones, nunca para guardar
  valor.
- ✅ **Real**: el mecanismo de "gas patrocinado" — el usuario firma gratis
  con su wallet invisible (Privy) y el backend paga el gas por él,
  usando exactamente las funciones `*For` del contrato, verificadas con
  ECDSA/EIP-712, no un atajo de confianza ciega.
- ⚠️ **Simulado a propósito, como corresponde a un prototipo de hackathon**:
  la conversión pesos↔USD usa una tasa fija de demo en vez de un proveedor
  de pagos real (Mercado Pago/banco), y no hay todavía verificación de
  KYC/regulatoria para mover dinero real de terceros — eso es un paso de
  negocio/legal, no arquitectónico, y está identificado como próximo paso.

## Por qué USDC y no MON como moneda del fondo

MON es una criptomoneda con precio de mercado: sube y baja. Si el fondo
guardara MON, el saldo en pesos que ve el usuario cambiaría solo, sin que
nadie gastó nada — inexplicable para alguien que no sigue el mercado
cripto. USDC es un *stablecoin*: cada unidad vale siempre 1 dólar,
respaldado 1:1 por Circle, y ya está desplegado oficialmente en Monad
(mainnet y testnet). Así la única conversión que sobrevive es pesos↔dólares
— la misma que ya hace cualquier caja de ahorro en dólares de un banco
argentino, no una fluctuación cripto.

## Arquitectura

```
Usuario (Google login)
      │  Privy crea una wallet invisible, sin que el usuario la vea
      ▼
Frontend  (React + Vite + TS)  ── login, balance en $, gastar, votar
      │  el usuario firma "quiero gastar $X" GRATIS (EIP-712, sin gas)
      ▼
Backend   (NestJS)              ── verifica el login, guarda usuarios/grupos
      │  el RELAYER (una wallet propia) paga el gas y manda la transacción
      ▼
Contrato  (Solidity, Monad Testnet) ── límites, votación, verificación de firma
```

## Estructura del repo

```
contracts/   Smart contracts (Solidity) + tests de Hardhat
backend/     API NestJS: login (Privy), relayer que paga el gas, puente fiat↔onchain
frontend/    App React + Vite + TS: la experiencia del usuario final
```

Cada carpeta tiene su propio `README`/`.env.example` con el detalle de
puesta en marcha. Orden recomendado para levantarlo de punta a punta:

1. `contracts/` → desplegar `SharedWalletFactory` una vez en Monad Testnet
   (ver `contracts/scripts/deploy.ts`).
2. `backend/` → configurar `.env` (Postgres, Privy, la wallet del relayer
   con MON del faucet, la dirección de la Factory) y `npm run start:dev`.
3. `frontend/` → configurar `.env` (mismo `PRIVY_APP_ID`, URL del backend)
   y `npm run dev`.

## Demos ya publicadas (sin instalar nada)

- App técnica sobre Monad (conectás MetaMask directo, sin backend):
  https://claude.ai/artifact/7s1HXEJa9MSvBAkdsnFqRr
- App fiat con la experiencia final (simulada en el navegador, sin backend
  real conectado todavía): https://claude.ai/artifact/4LwgaAr2mQiRH6AvTP2ufs

## Track del hackathon

**Track 02 — Consumer Products & Payments.** El ejemplo textual de la
convocatoria — *shared wallets and group spending that settle up without
an intermediary* — es literalmente la funcionalidad central de este
proyecto.

## Roadmap después del hackathon

- Reemplazar la tasa de conversión fija por un proveedor de pagos real
  (Mercado Pago/transferencia bancaria) con webhooks firmados.
- Reemplazar el polling del frontend por WebSockets (backend escuchando
  los eventos del contrato en tiempo real).
- Asesoría legal sobre manejo de fondos de terceros antes de operar con
  dinero real (no solo MON de testnet).

## Licencia

MIT — ver `LICENSE`.

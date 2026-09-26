# Backend de Fondo Común (NestJS)

Puente entre el mundo "pesos" que ve el usuario y el mundo onchain en Monad
donde viven de verdad las reglas (límites, aprobaciones). El usuario final
nunca ve wallets, gas ni MON — solo un balance en pesos y botones normales.

## Cómo se conectan las piezas

```
App (Google login) --Privy--> wallet invisible del usuario
        |
        | el usuario FIRMA gratis (sin gas) "quiero gastar $X"
        v
   Backend NestJS  --RelayerService (paga el gas)-->  Contrato en Monad
```

## Puesta en marcha

1. **Postgres**: creá una base y pegá su URL en `DATABASE_URL` (`.env`, copiá `.env.example`).
2. **Privy**: creá una app en https://dashboard.privy.io, activá Google como método
   de login y copiá `PRIVY_APP_ID` / `PRIVY_APP_SECRET`.
3. **Relayer**: generá una wallet nueva (ej. `openssl rand -hex 32` como clave privada,
   o cualquier wallet que crees en Remix), pedile MON gratis en https://faucet.monad.xyz,
   y pegá su clave privada en `RELAYER_PRIVATE_KEY`. Esta es la wallet que paga el
   gas de **todos** los usuarios — cuanto más uso tenga la app, más MON va a necesitar.
4. **Factory**: desplegá `SharedWalletFactory` (de `SharedWallet.sol`) en Monad Testnet
   pasándole como argumento la dirección de tu relayer (paso 3). Pegá la dirección
   desplegada en `FACTORY_CONTRACT_ADDRESS`.
5. `npm install`
6. `npm run start:dev`

## Cómo el frontend arma la firma (sin esto, el backend no tiene qué reenviar)

El frontend usa el SDK de Privy para el login/wallet, y `ethers` (o el propio
`signTypedData` de Privy) para que el usuario firme la acción **gratis**,
antes de mandarla a este backend:

```javascript
// 1. Pedirle el nonce actual al backend
const { nonce } = await fetch(`/groups/${groupId}/nonce`, { headers: authHeaders }).then(r => r.json());

// 2. Armar el mensaje EIP-712 (tiene que calzar EXACTO con el contrato)
const domain = {
  name: "SharedWallet",
  version: "1",
  chainId: 10143,
  verifyingContract: groupContractAddress,
};
const types = {
  RequestExpense: [
    { name: "user", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "desc", type: "string" },
    { name: "forceApproval", type: "bool" },
    { name: "nonce", type: "uint256" },
  ],
};
const value = { user: myWalletAddress, amount: parseEther("500"), desc: "Cena", forceApproval: false, nonce };

// 3. El usuario firma con su wallet invisible de Privy (gratis, sin gas)
const signature = await privyWallet.signTypedData({ domain, types, primaryType: "RequestExpense", message: value });

// 4. Mandarle la firma a este backend, que la reenvía a la blockchain pagando el gas
await fetch(`/groups/${groupId}/expense`, {
  method: "POST",
  headers: authHeaders,
  body: JSON.stringify({ amountMon: "500", desc: "Cena", forceApproval: false, nonce, signature }),
});
```

`vote` y `join` funcionan igual, cambiando el `types`/`value` según el
`VOTE_TYPEHASH` / `JOIN_TYPEHASH` del contrato.

## Qué es demo y qué es real acá

- ✅ **Real**: la verificación de firmas, los límites y las aprobaciones — todo
  eso corre de verdad en Monad, nadie (ni este backend) puede saltárselo.
- ⚠️ **Simplificado a propósito para el hackathon**: la conversión pesos↔MON
  usa una tasa fija (`DEMO_FIAT_TO_MON_RATE`) en vez de un proveedor de pagos
  real (Mercado Pago/banco), y el endpoint de depósito no tiene todavía la
  verificación de webhook firmado de ese proveedor. Ambas cosas son el
  siguiente paso natural, no un cambio de arquitectura.

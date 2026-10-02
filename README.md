# Fondo Comun

Fondo Comun es una aplicacion web que cree para que grupos de personas (como amigos, familiares o companeros de oficina) puedan juntar dinero en un pozo compartido de forma totalmente transparente y segura. La idea es que podamos guardar ese dinero en dolares digitales (USDC) utilizando la red Monad y gestionar todos los gastos de forma grupal, mediante un sistema de votaciones. Lo mejor de todo es que nadie necesita saber absolutamente nada de criptomonedas ni pagar comisiones extrañas; la plataforma se encarga de toda esa complejidad por detras.

## El problema que venimos a solucionar
Tradicionalmente, cuando un grupo necesita juntar dinero para algo (un viaje, una cena, comprar cosas para la oficina), una sola persona se encarga de recolectar todo el dinero en su cuenta bancaria personal. Esto siempre trae problemas:
- Falta de transparencia: Los demas no pueden ver exactamente cuanto dinero hay o en que se gasto.
- Riesgo centralizado: Si la persona que tiene el dinero tiene algun problema con su cuenta bancaria, todo el grupo se ve afectado.
- Desconfianza y friccion: Para cada gasto, la persona administradora tiene que rendir cuentas manualmente y avisar a los demas.

Con Fondo Comun, el dinero no lo tiene una persona, lo tiene un "contrato inteligente" inviolable. Las reglas de como se gasta ese dinero estan escritas en codigo y todos los miembros tienen voz y voto sobre que se hace con los fondos. 

## Nuestras Ventajas
- Transparencia total: Todos los miembros del grupo pueden ver el saldo exacto en todo momento y el historial de movimientos.
- Democracia financiera: Ningun miembro (ni siquiera el creador del grupo) puede gastar el dinero si la mayoria no esta de acuerdo. Todo pasa por un sistema de votacion.
- Proteccion contra la inflacion: Al convertir el dinero a dolares digitales (USDC), nos aseguramos de que los fondos mantengan su poder adquisitivo.
- Cero complicaciones: Los usuarios ingresan con su correo electronico y usan la aplicacion como cualquier otra. Nosotros cubrimos todas las comisiones de la red por detras (es un sistema sin comisiones para el usuario final).
- Tiempo real: Cualquier deposito, propuesta de gasto o voto se actualiza al instante en la pantalla de todos los miembros del grupo gracias a nuestro sistema de notificaciones en vivo.

## Funcionalidades Principales
- Inicio de sesion simple: Solo necesitas tu correo electronico para entrar.
- Creacion y administracion de grupos: Podes crear fondos comunes, invitar a otras personas compartiendo un simple enlace, cambiar el nombre del grupo e incluso transferir la administracion a otra persona.
- Depositos simulados: Podes simular ingresos de dinero en moneda local y la plataforma lo convierte automaticamente a dolares digitales tomando el valor de mercado en tiempo real.
- Sistema de limites de gastos: Cada grupo tiene un limite de credito y un limite de transacciones diarias. Si alguien quiere gastar mas de eso, se genera una propuesta de aprobacion.
- Votaciones agiles: Si un gasto supera el limite, los miembros deben votar. La regla es clara: si son dos personas, el otro debe aprobar; si son tres o mas, se requiere la mayoria absoluta.
- Modificacion de limites: El creador puede proponer aumentar o reducir los limites del grupo, lo cual tambien se somete a votacion.
- Cancelacion y retiro de administrador: Un creador puede proponer eliminar el grupo. Si los participantes lo rechazan, el creador puede cancelar su propuesta o simplemente transferirle su puesto a otro miembro y salir del grupo limpiamente.
- Perfil personalizable: Cada usuario puede editar su nombre para que los demas lo reconozcan facilmente en las votaciones y notificaciones. Si no lo hacen, usamos su correo para identificarlos.

## Guia para iniciar el proyecto desde cero

Si queres levantar este proyecto en tu propia computadora, aca te explico paso a paso como hacerlo. 

### Requisitos Previos
1. Instalar Node.js (version 18 o superior) en tu computadora.
2. Tener una base de datos PostgreSQL. Podes crearte una cuenta gratuita en Neon.tech y obtener ahi el enlace de conexion.
3. Crearte una cuenta en Privy (privy.io) para manejar la autenticacion de los usuarios.
4. Tener una billetera de desarrollo (como MetaMask) conectada a la red de pruebas de Monad (Monad Testnet). Vas a necesitar algunos tokens MON de prueba para cubrir las comisiones y tokens USDC para los movimientos.

### 1. Levantar los Smart Contracts
El nucleo de la confianza esta en la carpeta "contracts". Aca es donde creamos las reglas del juego.

Entra a la carpeta de contratos e instala las dependencias:
npm install

Crea un archivo llamado ".env" en esta carpeta y agrega las siguientes variables:
PRIVATE_KEY=Aca pones la clave privada de tu billetera MetaMask. ¡No la compartas con nadie!
MONAD_RPC_URL=Aca pones la direccion de la red de pruebas, por ejemplo: https://testnet-rpc.monad.xyz/

Despues, compila y subi los contratos a la red ejecutando:
npx hardhat compile
npx hardhat run scripts/deploy.ts --network monadTestnet

Cuando termine, la consola te va a dar la direccion del contrato "SharedWalletFactory" y la direccion del token "USDC". Guarda esos datos porque los vamos a usar en el backend.

### 2. Levantar el Backend
El backend es el motor que coordina todo, guarda el historial en la base de datos y paga las comisiones de los usuarios.

Entra a la carpeta del backend e instala las dependencias:
npm install

Crea un archivo llamado ".env" en la carpeta backend con estas variables:
DATABASE_URL=Aca va el enlace de conexion de tu base de datos PostgreSQL (la que creaste en Neon).
PRIVY_APP_ID=El ID de tu aplicacion en Privy (lo sacas de su pagina web).
PRIVY_APP_SECRET=El secreto de tu aplicacion en Privy.
MONAD_RPC_URL=La misma direccion de red que usamos en los contratos.
RELAYER_PRIVATE_KEY=La clave privada de la billetera que va a pagar las comisiones de los usuarios.
FACTORY_CONTRACT_ADDRESS=La direccion del contrato SharedWalletFactory que guardamos en el paso 1.
MONAD_USDC_ADDRESS=La direccion del token USDC que guardamos en el paso 1.
DEMO_FIAT_TO_USD_RATE=0.001 (Esto es por si falla la consulta del dolar en tiempo real).

Una vez configurado, inicia el servidor con:
npm run start:dev

### 3. Levantar el Frontend
Esta es la cara visible de la aplicacion, lo que ven los usuarios.

Entra a la carpeta del frontend e instala las dependencias:
npm install

Crea un archivo llamado ".env" en la carpeta frontend con estas variables:
VITE_PRIVY_APP_ID=El mismo ID de aplicacion de Privy que usaste en el backend.
VITE_API_URL=http://localhost:3000 (Esta es la direccion donde esta corriendo nuestro backend local).

Para iniciar la aplicacion web, ejecuta:
npm run dev

¡Y listo! Ya podes entrar a la direccion que te indique la consola y empezar a usar Fondo Comun.

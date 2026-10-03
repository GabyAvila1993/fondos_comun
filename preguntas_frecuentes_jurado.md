# Q&A para el Jurado y Modelo de Negocios

Este documento está diseñado como tu "arma secreta" para el momento de las preguntas y respuestas. Contiene la justificación financiera de por qué Fondo Común es un modelo de negocios sólido, rentable y escalable.

---

## 💼 Nuestro Modelo de Negocios

Fondo Común tiene dos vías principales de ingresos diseñadas para ser amigables con el usuario, pero altamente rentables para la plataforma. El capital original del usuario (sus depósitos y retiros) es sagrado y **nunca** se toca ni se le cobran comisiones.

### 1. Modelo Yield (Inversión Automática 70/30)
**¿Cómo funciona?**
Todo el dinero que ingresan los grupos se convierte a dólares digitales (USDC). Como los fondos suelen quedar inactivos por días o semanas hasta que se realiza el gasto grupal, el protocolo toma ese capital y lo coloca de forma automatizada en protocolos DeFi de bajo riesgo (como Aave) para generar un rendimiento anual (ej. 4% - 5%).
- **El 70%** de esos intereses generados se los queda la aplicación de forma líquida. Esta cuenta maestra (el Relayer) usa una pequeña fracción de esto para pagar el gas de la red Monad por todos los usuarios, y el resto es ganancia pura.
- **El 30%** restante se devuelve a los fondos del grupo.

**¿Por qué va a funcionar?**
Porque estamos dándole "plata gratis" a los usuarios simplemente por usar nuestra plataforma. Ninguna cuenta bancaria tradicional que administre "fondos de viaje" te paga intereses en dólares por tener la plata ahí. El usuario gana, la plataforma se vuelve completamente autosustentable (pagando su propio gas) y genera ganancias.

### 2. Modelo Freemium (Suscripciones B2C y B2B)
**¿Cómo funciona?**
La plataforma tiene límites de capacidad en los contratos inteligentes basados en la cantidad de miembros, diseñados para monetizar según el caso de uso:
- **Gratis (Hasta 5 miembros):** Creador + 4 invitados. Ideal para amigos o familiares organizando una cena o un viaje pequeño.
- **Nivel 1 ($5,000 ARS/mes | 6 a 10 miembros):** Ideal para equipos de fútbol amateur, regalos de la oficina o pequeños grupos de estudio. 
- **Nivel 2 ($10,000 ARS/mes | Más de 10 miembros):** Diseñado para grandes organizaciones, consorcios de edificios, o empresas que necesitan transparencia extrema en sus tesorerías.

**¿Por qué va a funcionar?**
Porque está apoyado en la psicología del precio. Ofrecerlo gratis hasta 5 usuarios garantiza el crecimiento viral (la gente invita a sus amigos para probarlo). Cuando un equipo de 10 personas choca con el límite, pagar $5,000 ARS se divide a $500 pesos por persona; un costo completamente imperceptible a cambio de tener transparencia total y votaciones inmutables sobre su dinero colectivo.

---

## 🎤 Preguntas Frecuentes del Jurado (y cómo responderlas)

**Juez:** *"Veo que utilizan un Relayer para pagar el gas de los usuarios. ¿No se van a quedar sin plata rápidamente si la app se vuelve viral?"*
**Tu respuesta:** "No, por dos razones. Primero, porque construimos sobre Monad, donde las transacciones cuestan fracciones ínfimas de centavo. Nuestro costo de adquisición es minúsculo. Segundo, porque los fondos en USDC se colocan en protocolos de rendimiento (DeFi). Nosotros retenemos el 70% de esos rendimientos, lo cual crea una máquina autosustentable que cubre los costos de gas de forma infinita y deja margen de ganancia."

**Juez:** *"¿Por qué la gente pagaría una suscripción mensual si juntar plata en una cuenta de Mercado Pago o banco tradicional es gratis?"*
**Tu respuesta:** "Por la transparencia y la confianza. Cuando pones plata en la cuenta de otra persona, pierdes el control total; si esa persona gasta mal el dinero o tiene un problema bancario, el consorcio entero se ve afectado. Fondo Común ofrece una tesorería descentralizada donde nadie puede mover un centavo sin que la mayoría vote y lo apruebe matemáticamente en la blockchain. Las empresas y consorcios pagan gustosos por tener sus fondos inmutables y auditables."

**Juez:** *"¿Qué pasa con el 30% de las ganancias del Yield que le dan a los usuarios? ¿Por qué no quedarse el 100%?"*
**Tu respuesta:** "Es nuestra mejor estrategia de retención. Al no tocar jamás el capital principal y encima darles un 30% de interés pasivo en dólares, los usuarios tienen un incentivo financiero para no sacar la plata de la plataforma hasta que realmente necesiten usarla. Eso aumenta nuestro TVL (Total Value Locked) y, paradójicamente, nos hace ganar más dinero a largo plazo."

**Juez:** *"¿Por qué elegiste la red Monad para esto?"*
**Tu respuesta:** "Fondo Común no sería posible en Ethereum. Para que el modelo de pagarle el gas a los usuarios (gasless) sea rentable, necesito una red que ofrezca comisiones microscópicas pero con compatibilidad EVM para los contratos inteligentes. Además, las notificaciones por WebSockets en el frontend exigen que las transacciones se confirmen rapidísimo. Los 10,000 TPS de Monad me permiten dar una experiencia de usuario que se siente idéntica a la Web2."

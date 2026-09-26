import { usePrivy } from "@privy-io/react-auth";

export default function LoginScreen() {
  const { login } = usePrivy();

  return (
    <div className="login-screen">
      <div className="logo-glow">💰</div>
      <h1>Fondo Común</h1>
      <p>Tu billetera compartida para viajes, comidas y gastos en grupo. Simple como cualquier billetera virtual.</p>
      <button className="google-btn" onClick={login}>
        Continuar con Google
      </button>
      <p className="login-hint">Creamos tu billetera automáticamente y de forma segura. No necesitás instalar nada más.</p>
    </div>
  );
}

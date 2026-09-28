import { usePrivy } from "@privy-io/react-auth";

export default function LoginScreen() {
  const { login } = usePrivy();

  return (
    <div className="login-screen">
      <div className="logo-glow">
        <img src="/icon.png" alt="Fondo Común Logo" className="app-logo-large" />
      </div>
      <h1>Fondo Común</h1>
      <p>Gestión transparente de gastos grupales. Tan simple como cualquier billetera virtual.</p>
      <button className="google-btn" onClick={login}>
        Continuar con Google
      </button>
      <p className="login-hint">Tu billetera se configura de forma automática y segura. Sin instalaciones adicionales.</p>
    </div>
  );
}

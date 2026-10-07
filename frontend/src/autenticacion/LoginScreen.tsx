import { usePrivy } from "@privy-io/react-auth";

export default function LoginScreen() {
  const { login } = usePrivy();

  return (
    <div className="login-screen">
      <img src="/icon.png" alt="Logo" style={{ width: 80, height: 80, marginBottom: 24, borderRadius: 20 }} />
      <h1>Fondo Común</h1>
      <p>Ahorra y gestiona fondos con amigos de forma segura, rápida y transparente.</p>
      
      <button className="google-btn" onClick={login} style={{ justifyContent: "center", gap: "12px", padding: "14px 24px" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 7H5C3.89 7 3 7.89 3 9V15C3 16.11 3.89 17 5 17H19C20.11 17 21 16.11 21 15V9C21 7.89 20.11 7 19 7ZM16 14C14.9 14 14 13.1 14 12C14 10.9 14.9 10 16 10C17.1 10 18 10.9 18 12C18 13.1 17.1 14 16 14Z" fill="currentColor"/>
        </svg>
        Ingresar a la App
      </button>
      
      <div style={{ marginTop: 24, fontSize: "0.85rem", opacity: 0.7 }}>
        Pagos seguros y On-Chain
      </div>
      
      <div style={{ marginTop: 40, fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", textAlign: "center", maxWidth: "260px", lineHeight: "1.4" }}>
        <b>🏛️ Para el Jurado:</b><br/> Haz clic en ingresar y selecciona <b>Continue with a wallet</b> para usar MetaMask en la Testnet.
      </div>
    </div>
  );
}

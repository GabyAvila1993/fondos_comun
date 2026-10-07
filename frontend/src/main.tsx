import React from "react";
import ReactDOM from "react-dom/client";
import { PrivyProvider } from "@privy-io/react-auth";
import App from "./App";
import { ENV } from "./env";
import "./compartido/estilos/app.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/*
      PrivyProvider es quien muestra el modal de "Continuar con Google/Apple"
      y crea la wallet invisible del usuario la primera vez que entra.
      No hace falta escribir nada de eso a mano: viene armado en el SDK.
    */}
    <PrivyProvider
      appId={ENV.PRIVY_APP_ID}
      config={{
        loginMethods: ["google", "email", "wallet"],
        embeddedWallets: { createOnLogin: "users-without-wallets" },
        appearance: { theme: "light", accentColor: "#0F3D37" },
      }}
    >
      <App />
    </PrivyProvider>
  </React.StrictMode>,
);

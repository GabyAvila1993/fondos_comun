import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { usePrivy } from "@privy-io/react-auth";
export default function LoginScreen() {
    const { login } = usePrivy();
    return (_jsxs("div", { className: "login-screen", children: [_jsx("div", { className: "logo-glow", children: _jsx("img", { src: "/icon.png", alt: "Fondo Com\u00FAn Logo", className: "app-logo-large" }) }), _jsx("h1", { children: "Fondo Com\u00FAn" }), _jsx("p", { children: "Gesti\u00F3n transparente de gastos grupales. Tan simple como cualquier billetera virtual." }), _jsx("button", { className: "google-btn", onClick: login, children: "Continuar con Google" }), _jsx("p", { className: "login-hint", children: "Tu billetera se configura de forma autom\u00E1tica y segura. Sin instalaciones adicionales." })] }));
}

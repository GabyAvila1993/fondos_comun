import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { usePrivy } from "@privy-io/react-auth";
export default function LoginScreen() {
    const { login } = usePrivy();
    return (_jsxs("div", { className: "login-screen", children: [_jsx("div", { className: "logo-glow", children: "\uD83D\uDCB0" }), _jsx("h1", { children: "Fondo Com\u00FAn" }), _jsx("p", { children: "Tu billetera compartida para viajes, comidas y gastos en grupo. Simple como cualquier billetera virtual." }), _jsx("button", { className: "google-btn", onClick: login, children: "Continuar con Google" }), _jsx("p", { className: "login-hint", children: "Creamos tu billetera autom\u00E1ticamente y de forma segura. No necesit\u00E1s instalar nada m\u00E1s." })] }));
}

import { jsx as _jsx } from "react/jsx-runtime";
import { usePrivy } from "@privy-io/react-auth";
import LoginScreen from "./components/LoginScreen";
import UserDashboard from "./components/UserDashboard";
export default function App() {
    const { ready, authenticated } = usePrivy();
    if (!ready)
        return null; // Privy todavia esta chequeando la sesion guardada
    return _jsx("div", { className: "phone", children: authenticated ? _jsx(UserDashboard, {}) : _jsx(LoginScreen, {}) });
}

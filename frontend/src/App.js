import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { usePrivy } from "@privy-io/react-auth";
import { Toaster } from "react-hot-toast";
import { SocketProvider } from "./context/SocketContext";
import LoginScreen from "./components/LoginScreen";
import UserDashboard from "./components/UserDashboard";
export default function App() {
    const { ready, authenticated } = usePrivy();
    if (!ready)
        return null;
    return (_jsxs(SocketProvider, { children: [_jsx(Toaster, { position: "top-center" }), authenticated ? _jsx(UserDashboard, {}) : _jsx(LoginScreen, {})] }));
}

import { usePrivy } from "@privy-io/react-auth";
import { Toaster } from "react-hot-toast";
import { SocketProvider } from "./notificaciones/SocketContext";
import LoginScreen from "./autenticacion/LoginScreen";
import UserDashboard from "./UserDashboard";

export default function App() {
  const { ready, authenticated } = usePrivy();

  if (!ready) return null;
  return (
    <SocketProvider>
      <Toaster position="top-center" />
      {authenticated ? <UserDashboard /> : <LoginScreen />}
    </SocketProvider>
  );
}

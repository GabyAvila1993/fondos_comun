import { usePrivy } from "@privy-io/react-auth";
import { Toaster } from "react-hot-toast";
import { SocketProvider } from "./context/SocketContext";
import LoginScreen from "./components/LoginScreen";
import UserDashboard from "./components/UserDashboard";

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

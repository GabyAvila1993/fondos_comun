import { usePrivy } from "@privy-io/react-auth";
import LoginScreen from "./components/LoginScreen";
import UserDashboard from "./components/UserDashboard";

export default function App() {
  const { ready, authenticated } = usePrivy();

  if (!ready) return null; // Privy todavia esta chequeando la sesion guardada
  return <div className="phone">{authenticated ? <UserDashboard /> : <LoginScreen />}</div>;
}

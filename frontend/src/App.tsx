import { usePrivy } from "@privy-io/react-auth";
import LoginScreen from "./components/LoginScreen";
import UserDashboard from "./components/UserDashboard";

export default function App() {
  const { ready, authenticated } = usePrivy();

  if (!ready) return null;
  return authenticated ? <UserDashboard /> : <LoginScreen />;
}

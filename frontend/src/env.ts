export const ENV = {
  PRIVY_APP_ID: import.meta.env.VITE_PRIVY_APP_ID as string,
  BACKEND_URL: (import.meta.env.VITE_BACKEND_URL as string) || "http://localhost:3000",
  CHAIN_ID: Number(import.meta.env.VITE_CHAIN_ID || 10143),
};

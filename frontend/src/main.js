import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import ReactDOM from "react-dom/client";
import { PrivyProvider } from "@privy-io/react-auth";
import App from "./App";
import { ENV } from "./env";
import "./styles/app.css";
ReactDOM.createRoot(document.getElementById("root")).render(_jsx(React.StrictMode, { children: _jsx(PrivyProvider, { appId: ENV.PRIVY_APP_ID, config: {
            loginMethods: ["google", "email"],
            embeddedWallets: { createOnLogin: "users-without-wallets" },
            appearance: { theme: "dark", accentColor: "#e0a838" },
        }, children: _jsx(App, {}) }) }));

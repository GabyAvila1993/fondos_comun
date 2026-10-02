import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Connect to the backend
    const s = io(import.meta.env.VITE_API_URL || "http://localhost:3000");
    setSocket(s);

    s.on("new_movement", (data) => {
      toast(data.message, {
        icon: data.type === "deposit" ? "💰" : "💳",
        style: {
          borderRadius: '10px',
          background: 'var(--card-bg)',
          color: 'var(--text-color)',
          border: '1px solid var(--border-color)',
        },
      });
      if (data.groupId) {
        window.dispatchEvent(new CustomEvent("refresh_group", { detail: data.groupId }));
      }
    });

    s.on("vote", (data) => {
      window.dispatchEvent(new CustomEvent("socket_vote", { detail: data }));
    });

    s.on("group_deleted", (data) => {
      window.dispatchEvent(new CustomEvent("socket_group_deleted", { detail: data }));
    });

    s.on("system", (data) => {
      window.dispatchEvent(new CustomEvent("socket_system", { detail: data }));
    });

    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";
import { ENV } from "../env";

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Connect to the backend
    const s = io(ENV.BACKEND_URL);
    setSocket(s);

    s.on("new_movement", (data) => {
      const currentDbUserId = localStorage.getItem("monad_dbUserId");
      const isTarget = (!data.targetUserId && (!data.targetUserIds || data.targetUserIds.length === 0)) || 
             (currentDbUserId && data.targetUserId === currentDbUserId) || 
             (currentDbUserId && data.targetUserIds?.includes(currentDbUserId));
      
      if (!isTarget) return;

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

    s.on("limit_proposal", (data) => {
      window.dispatchEvent(new CustomEvent("socket_system", { detail: data }));
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

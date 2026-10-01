import { useState } from "react";
import { Link, UsersThree } from "@phosphor-icons/react";
import toast from "react-hot-toast";

interface UnirseTabProps {
  onJoinInit: (groupId: string) => void;
}

export default function UnirseTab({ onJoinInit }: UnirseTabProps) {
  const [inputValue, setInputValue] = useState("");

  const handleJoinClick = () => {
    let groupId = inputValue.trim();
    if (!groupId) return;

    // Si pegaron la URL completa, extraer el ID
    try {
      if (groupId.startsWith("http")) {
        const url = new URL(groupId);
        const joinParam = url.searchParams.get("join");
        if (joinParam) {
          groupId = joinParam;
        }
      }
    } catch (err) {
      // Ignorar si no es una URL válida y tratarlo como un ID directo
    }

    if (!groupId) {
      toast.error("Enlace o ID inválido");
      return;
    }

    onJoinInit(groupId);
    setInputValue(""); // limpiar
  };

  return (
    <div style={{ padding: "24px 20px" }}>
      <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
        <UsersThree weight="fill" color="var(--primary)" />
        Unirse a un Grupo
      </h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: "32px", fontSize: "14px", lineHeight: "1.5" }}>
        Pega el enlace de invitación o el ID del grupo para formar parte.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ position: "relative" }}>
          <Link 
            style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} 
            size={20} 
          />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ej: https://fondos-comun-front.onrender.com/?join= ..."
            className="unirse-input"
          />
        </div>

        <button 
          className="btn-primary" 
          disabled={!inputValue.trim()}
          onClick={handleJoinClick}
          style={{ width: "100%", padding: "16px", borderRadius: "12px", fontSize: "16px", fontWeight: "600", backgroundColor: "var(--primary)" }}
        >
          Unirme
        </button>
      </div>
    </div>
  );
}

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Link, UsersThree } from "@phosphor-icons/react";
import toast from "react-hot-toast";
export default function UnirseTab({ onJoinInit }) {
    const [inputValue, setInputValue] = useState("");
    const handleJoinClick = () => {
        let groupId = inputValue.trim();
        if (!groupId)
            return;
        // Si pegaron la URL completa, extraer el ID
        try {
            if (groupId.startsWith("http")) {
                const url = new URL(groupId);
                const joinParam = url.searchParams.get("join");
                if (joinParam) {
                    groupId = joinParam;
                }
            }
        }
        catch (err) {
            // Ignorar si no es una URL válida y tratarlo como un ID directo
        }
        if (!groupId) {
            toast.error("Enlace o ID inválido");
            return;
        }
        onJoinInit(groupId);
        setInputValue(""); // limpiar
    };
    return (_jsxs("div", { style: { padding: "24px 20px" }, children: [_jsxs("h2", { style: { fontSize: "24px", fontWeight: "700", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }, children: [_jsx(UsersThree, { weight: "fill", color: "var(--primary)" }), "Unirse a un Grupo"] }), _jsx("p", { style: { color: "var(--text-secondary)", marginBottom: "32px", fontSize: "14px", lineHeight: "1.5" }, children: "Pega el enlace de invitaci\u00F3n o el ID del grupo para formar parte." }), _jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "16px" }, children: [_jsxs("div", { style: { position: "relative" }, children: [_jsx(Link, { style: { position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }, size: 20 }), _jsx("input", { type: "text", value: inputValue, onChange: (e) => setInputValue(e.target.value), placeholder: "Ej: http://localhost:5173/?join=...", className: "unirse-input" })] }), _jsx("button", { className: "btn-primary", disabled: !inputValue.trim(), onClick: handleJoinClick, style: { width: "100%", padding: "16px", borderRadius: "12px", fontSize: "16px", fontWeight: "600", backgroundColor: "var(--primary)" }, children: "Unirme" })] })] }));
}

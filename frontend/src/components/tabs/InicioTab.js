import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Plus, Wallet, FileText, Users, ShareNetwork, CaretDown } from "@phosphor-icons/react";
import toast from "react-hot-toast";
const fmt = (n) => "$" + Math.round(n).toLocaleString("es-AR");
export default function InicioTab({ groups, activeGroupId, onSelectGroup, onGroupClick, onNewGroup, onDeposit, onSpend }) {
    const activeGroup = groups.find((g) => g.id === activeGroupId);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const handleShare = (e, groupId) => {
        e.stopPropagation();
        const inviteLink = `${window.location.origin}/?join=${groupId}`;
        navigator.clipboard.writeText(inviteLink);
        toast.success("¡Enlace de invitación copiado!");
    };
    return (_jsxs("div", { children: [_jsxs("div", { className: "header-green", children: [_jsxs("div", { className: "header-top", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("img", { src: "/icon.png", alt: "Logo", style: { width: 24, height: 24 } }), _jsx("span", { className: "header-title", children: "Fondo Com\u00FAn" })] }), _jsxs("div", { className: "custom-dropdown-container", children: [_jsxs("button", { className: "custom-dropdown-button", onClick: () => setIsDropdownOpen(!isDropdownOpen), children: [activeGroup ? activeGroup.name : "Seleccionar grupo", _jsx(CaretDown, { weight: "bold" })] }), isDropdownOpen && (_jsx("div", { className: "custom-dropdown-menu", children: groups.map((g) => (_jsx("div", { className: "custom-dropdown-item", onClick: () => {
                                                onSelectGroup(g.id);
                                                setIsDropdownOpen(false);
                                            }, children: g.name }, g.id))) }))] })] }), activeGroup ? (_jsxs("div", { className: "balance-section", children: [_jsx("div", { className: "balance-label", children: "Fondo disponible" }), _jsx("div", { className: "balance-amount", children: fmt(Number(activeGroup.balance || 0) * 1000) }), _jsxs("div", { className: "limit-info mt-2", children: ["L\u00EDmite libre por persona: ", _jsx("span", { style: { fontWeight: 600 }, children: fmt(Number(activeGroup.creditLimit) * 1000) })] })] })) : (_jsxs("div", { className: "text-center", style: { padding: "20px 0" }, children: [_jsx("div", { className: "balance-label", children: "No tienes grupos activos" }), _jsx("div", { className: "balance-amount", children: "$0" })] }))] }), _jsxs("div", { className: "quick-actions-card", children: [_jsxs("button", { className: "action-btn", onClick: onDeposit, children: [_jsx("div", { className: "action-icon icon-green", children: _jsx(Plus, { weight: "bold" }) }), _jsx("span", { children: "Ingresar dinero" })] }), _jsxs("button", { className: "action-btn", onClick: onSpend, children: [_jsx("div", { className: "action-icon icon-yellow", children: _jsx(Wallet, { weight: "fill" }) }), _jsx("span", { children: "Retirar" })] }), _jsxs("button", { className: "action-btn", onClick: onSpend, children: [_jsx("div", { className: "action-icon icon-purple", children: _jsx(FileText, { weight: "fill" }) }), _jsx("span", { children: "Pedir monto mayor" })] }), _jsxs("button", { className: "action-btn", onClick: onNewGroup, children: [_jsx("div", { className: "action-icon icon-gray", children: _jsx(Users, { weight: "fill" }) }), _jsx("span", { children: "Crear nuevo grupo" })] })] }), _jsxs("div", { className: "card", style: { padding: "0" }, children: [_jsxs("div", { className: "card-title", style: { padding: "20px 20px 8px" }, children: ["Tus grupos", _jsx("span", { style: { fontSize: "0.8rem", color: "var(--primary-light)", cursor: "pointer", fontWeight: 500 }, children: "Ver todos" })] }), _jsxs("div", { className: "group-list", style: { padding: "0 20px 8px" }, children: [groups.map((g) => (_jsxs("div", { className: "group-list-item", onClick: () => onGroupClick(g.id), children: [_jsx("div", { className: "group-avatar", children: g.name.substring(0, 2).toUpperCase() }), _jsxs("div", { className: "group-info", children: [_jsx("div", { className: "group-name", children: g.name }), _jsxs("div", { className: "group-meta", children: [g.members?.length || 1, " de ", g.members?.length || 1, " miembros"] })] }), _jsx("div", { className: "group-balance", children: fmt(Number(g.balance || 0) * 1000) }), _jsx("button", { onClick: (e) => handleShare(e, g.id), style: {
                                            background: "transparent",
                                            color: "var(--primary-light)",
                                            padding: "8px",
                                            borderRadius: "50%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center"
                                        }, children: _jsx(ShareNetwork, { size: 20, weight: "bold" }) })] }, g.id))), groups.length === 0 && (_jsx("div", { className: "text-center text-muted", style: { padding: "20px 0" }, children: "A\u00FAn no formas parte de ning\u00FAn grupo." }))] })] })] }));
}

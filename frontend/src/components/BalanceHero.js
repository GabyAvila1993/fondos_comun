import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const fmt = (n) => "$" + Math.round(n).toLocaleString("es-AR");
export default function BalanceHero({ groups, activeId, onSelect, }) {
    const active = groups.find((g) => g.id === activeId);
    const balance = active ? Number(active.balance || 0) : 0;
    return (_jsxs("div", { className: "hero", children: [_jsx("div", { className: "label", children: "FONDO DISPONIBLE" }), _jsx("div", { className: "amount", children: fmt(balance) }), _jsx("div", { className: "group-tabs", children: groups.map((g) => (_jsx("div", { className: `group-tab ${g.id === activeId ? "active" : ""}`, onClick: () => onSelect(g.id), children: g.name }, g.id))) })] }));
}

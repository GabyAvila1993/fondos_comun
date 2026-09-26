import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const fmt = (n) => "$" + Math.round(n).toLocaleString("es-AR");
const short = (addr) => addr.slice(0, 6) + "..." + addr.slice(-4);
export default function TransactionFeed({ transactions }) {
    if (!transactions.length)
        return _jsx("div", { className: "empty-state", children: "Todav\u00EDa no hay movimientos." });
    return (_jsx("div", { className: "list-card", children: transactions.map((t) => (_jsxs("div", { className: "row-item", children: [_jsx("div", { className: `row-icon ${t.rejected ? "pending" : "spend"}`, children: t.executed ? "🛍️" : "⏳" }), _jsxs("div", { className: "row-body", children: [_jsx("div", { className: "row-title", children: t.desc }), _jsxs("div", { className: "row-sub", children: [short(t.proposer), " \u00B7 ", new Date(t.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })] })] }), _jsxs("div", { className: "row-amount neg", children: ["-", fmt(Number(t.amount))] })] }, t.id))) }));
}

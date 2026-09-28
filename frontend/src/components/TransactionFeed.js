import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const MON_TO_FIAT_RATE = 0.001;
const fmtFiat = (monAmount) => {
    const fiatAmount = Number(monAmount) / MON_TO_FIAT_RATE;
    return "$" + Math.round(fiatAmount).toLocaleString("es-AR");
};
const short = (addr) => addr.slice(0, 6) + "..." + addr.slice(-4);
export default function TransactionFeed({ transactions }) {
    if (!transactions.length)
        return _jsx("div", { className: "empty-state", children: "No hay movimientos recientes." });
    return (_jsx("div", { className: "list-card", children: transactions.map((t) => (_jsxs("div", { className: "row-item", children: [_jsx("div", { className: `row-icon ${t.rejected ? "pending" : "spend"}`, children: t.executed ? "🛍️" : "⏳" }), _jsxs("div", { className: "row-body", children: [_jsx("div", { className: "row-title", children: t.desc }), _jsxs("div", { className: "row-sub", children: [short(t.proposer), " \u00B7 ", new Date(t.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })] })] }), _jsxs("div", { className: "row-amount neg", children: ["-", fmtFiat(Number(t.amount))] })] }, t.id))) }));
}

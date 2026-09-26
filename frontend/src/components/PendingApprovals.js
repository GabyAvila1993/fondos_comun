import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const fmt = (n) => "$" + Math.round(n).toLocaleString("es-AR");
const short = (addr) => addr.slice(0, 6) + "..." + addr.slice(-4);
export default function PendingApprovals({ pending, majorityNeeded, onVote, }) {
    if (!pending.length)
        return null;
    return (_jsxs("div", { id: "pendingSection", children: [_jsx("div", { className: "section-title", children: "Esperando aprobaci\u00F3n" }), pending.map((p) => (_jsxs("div", { className: "approval-card", children: [_jsxs("div", { className: "approval-top", children: [_jsxs("span", { children: [_jsx("b", { children: short(p.proposer) }), " pide ", fmt(Number(p.amount))] }), _jsxs("span", { children: [p.votesFor, "/", majorityNeeded] })] }), _jsx("div", { className: "approval-desc", children: p.desc }), _jsxs("div", { className: "vote-row", children: [_jsx("div", { className: "vote-btn", onClick: () => onVote(p.id, true), children: "Aprobar" }), _jsx("div", { className: "vote-btn", onClick: () => onVote(p.id, false), children: "Rechazar" })] })] }, p.id)))] }));
}

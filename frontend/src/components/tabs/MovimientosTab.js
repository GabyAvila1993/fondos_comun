import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo, useEffect } from "react";
const fmt = (n) => "$" + Math.round(n).toLocaleString("es-AR");
export default function MovimientosTab({ groups, initialGroupId }) {
    const [filter, setFilter] = useState("all");
    const [selectedGroupId, setSelectedGroupId] = useState(initialGroupId || null);
    useEffect(() => {
        setSelectedGroupId(initialGroupId || null);
    }, [initialGroupId]);
    // Normalizar los movimientos de cada grupo
    const allMovements = useMemo(() => {
        const list = [];
        for (const g of groups) {
            const usersMap = g.usersMap || {};
            const deposits = (g.deposits || []).map(dep => {
                const dateStr = String(dep.createdAt);
                const parsedTime = new Date(dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z').getTime();
                const u = usersMap[dep.userId];
                const uName = u ? (u.name || (u.email ? u.email.split('@')[0] : "Miembro")) : "Miembro";
                return {
                    type: "in",
                    id: `dep-${dep.id}`,
                    groupId: g.id,
                    groupName: g.name,
                    user: uName,
                    avatar: uName.substring(0, 2).toUpperCase(),
                    desc: "Ingreso de dinero",
                    amount: dep.amount,
                    timestamp: isNaN(parsedTime) ? Date.now() : parsedTime
                };
            });
            // Calcular la fecha base para los gastos: el máximo entre Date.now() y el depósito más reciente.
            // Esto soluciona la desincronización si la DB tiene el reloj más adelantado.
            const maxDepositTime = deposits.reduce((max, d) => Math.max(max, d.timestamp), 0);
            const baseTime = Math.max(Date.now(), maxDepositTime);
            const expenses = (g.transactions || []).map((tx, idx) => {
                const u = usersMap[tx.proposer.toLowerCase()];
                const defaultName = tx.proposer?.substring(0, 6) || "Unknown";
                const uName = u ? (u.name || (u.email ? u.email.split('@')[0] : defaultName)) : defaultName;
                return {
                    type: "out",
                    id: `tx-${tx.id}`,
                    groupId: g.id,
                    groupName: g.name,
                    user: uName,
                    avatar: uName.substring(0, 2).toUpperCase(),
                    desc: tx.desc || "Gasto general",
                    amount: Number(tx.amount) * 1000,
                    // Usamos baseTime para intercalar los gastos con los depósitos correctamente
                    timestamp: baseTime - ((g.transactions?.length || 0) - idx) * 60000
                };
            });
            list.push(...expenses, ...deposits);
        }
        return list.sort((a, b) => b.timestamp - a.timestamp);
    }, [groups]);
    // Si hay un grupo seleccionado, mostramos la vista detallada
    if (selectedGroupId) {
        const group = groups.find(g => g.id === selectedGroupId);
        if (!group)
            return null;
        const groupMovements = allMovements.filter(m => m.groupId === selectedGroupId && (filter === "all" || m.type === filter));
        const btnStyle = (active) => ({
            background: active ? "var(--primary)" : "var(--bg-2)",
            color: active ? "white" : "var(--text-muted)",
            padding: "6px 16px",
            borderRadius: "100px",
            fontSize: "0.85rem",
            fontWeight: 500,
            border: "none",
            cursor: "pointer"
        });
        return (_jsxs("div", { children: [_jsx("div", { className: "header-green", style: { paddingBottom: "24px", borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }, children: _jsxs("div", { className: "header-top", style: { marginBottom: 0 }, children: [_jsx("span", { style: { cursor: "pointer", marginRight: "10px", fontSize: "1.2rem" }, onClick: () => setSelectedGroupId(null), children: "\u2190" }), _jsxs("span", { className: "header-title", children: ["Movimientos en ", group.name] })] }) }), _jsxs("div", { style: { background: "var(--card-bg)", padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", gap: "8px", overflowX: "auto" }, children: [_jsx("button", { style: btnStyle(filter === "all"), onClick: () => setFilter("all"), children: "Todos" }), _jsx("button", { style: btnStyle(filter === "in"), onClick: () => setFilter("in"), children: "Ingresos" }), _jsx("button", { style: btnStyle(filter === "out"), onClick: () => setFilter("out"), children: "Gastos" })] }), _jsx("div", { className: "card", style: { padding: "0", margin: "0", borderRadius: 0, border: "none", boxShadow: "none" }, children: _jsxs("div", { className: "tx-list", style: { padding: "0 20px 20px" }, children: [groupMovements.map((item) => (_jsxs("div", { className: "tx-item", children: [_jsx("div", { className: "tx-avatar", style: { background: item.type === "in" ? "var(--primary-light)" : "var(--bg-2)", color: item.type === "in" ? "white" : "inherit" }, children: item.avatar }), _jsxs("div", { className: "tx-details", children: [_jsx("div", { className: "tx-user", children: item.type === "in" ? item.user : `Miembro ${item.user}...` }), _jsx("div", { className: "tx-desc", children: item.desc })] }), _jsxs("div", { children: [_jsxs("div", { className: `tx-amount ${item.type === "out" ? "negative" : "positive"}`, style: { color: item.type === "in" ? "var(--primary)" : "inherit" }, children: [item.type === "out" ? "- " : "+ ", fmt(item.amount)] }), _jsx("div", { className: "tx-date", children: item.type === "in" ? "Completado" : "Aprobado" })] })] }, item.id))), groupMovements.length === 0 && (_jsx("div", { className: "text-center text-muted", style: { padding: "40px 0" }, children: "No hay movimientos en este grupo." }))] }) })] }));
    }
    // Si no hay grupo seleccionado, mostramos la vista global agrupada
    return (_jsxs("div", { children: [_jsx("div", { className: "header-green", style: { paddingBottom: "24px", borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }, children: _jsx("div", { className: "header-top", style: { marginBottom: 0 }, children: _jsx("span", { className: "header-title", children: "\u00DAltimos Movimientos" }) }) }), _jsxs("div", { style: { padding: "20px" }, children: [groups.map(g => {
                        const m = allMovements.filter(x => x.groupId === g.id).slice(0, 3);
                        if (m.length === 0)
                            return null;
                        return (_jsxs("div", { style: { marginBottom: "30px" }, children: [_jsx("h3", { style: { fontSize: "1.1rem", marginBottom: "12px", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }, children: g.name }), _jsx("div", { className: "tx-list", children: m.map(item => (_jsxs("div", { className: "tx-item", style: { padding: "8px 0" }, children: [_jsx("div", { className: "tx-avatar", style: { background: item.type === "in" ? "var(--primary-light)" : "var(--bg-2)", color: item.type === "in" ? "white" : "inherit" }, children: item.avatar }), _jsxs("div", { className: "tx-details", children: [_jsx("div", { className: "tx-user", children: item.type === "in" ? item.user : `Miembro ${item.user}...` }), _jsx("div", { className: "tx-desc", children: item.desc })] }), _jsxs("div", { children: [_jsxs("div", { className: `tx-amount ${item.type === "out" ? "negative" : "positive"}`, style: { color: item.type === "in" ? "var(--primary)" : "inherit" }, children: [item.type === "out" ? "- " : "+ ", fmt(item.amount)] }), _jsx("div", { className: "tx-date", children: item.type === "in" ? "Completado" : "Aprobado" })] })] }, item.id))) }), _jsx("button", { onClick: () => setSelectedGroupId(g.id), style: {
                                        background: "transparent",
                                        color: "var(--primary)",
                                        border: "1px solid var(--primary)",
                                        borderRadius: "8px",
                                        padding: "8px",
                                        width: "100%",
                                        marginTop: "12px",
                                        fontWeight: 600,
                                        cursor: "pointer"
                                    }, children: "Ver M\u00E1s" })] }, g.id));
                    }), allMovements.length === 0 && (_jsx("div", { className: "text-center text-muted", style: { padding: "40px 0" }, children: "A\u00FAn no hay movimientos." }))] })] }));
}

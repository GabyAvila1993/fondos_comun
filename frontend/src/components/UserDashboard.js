import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { api } from "../lib/api";
import { signTyped, toWei } from "../lib/eip712";
import Sheet from "./Sheet";
import GroupDetail from "./GroupDetail";
import { DepositForm, SpendForm, NewGroupForm } from "./GroupForms";
export default function UserDashboard() {
    const { user, logout, getAccessToken } = usePrivy();
    const { wallets } = useWallets();
    const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
    const [activeTab, setActiveTab] = useState("resumen");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeGroupId, setActiveGroupId] = useState("");
    const [sheet, setSheet] = useState(null);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentView, setCurrentView] = useState("dashboard");
    const [selectedGroupForDetail, setSelectedGroupForDetail] = useState(null);
    const [displayName, setDisplayName] = useState(user?.google?.name || user?.email?.address || "");
    const [savingName, setSavingName] = useState(false);
    const [nameSaved, setNameSaved] = useState(false);
    const activeGroup = groups.find((g) => g.id === activeGroupId);
    useEffect(() => {
        (async () => {
            try {
                const token = await getAccessToken();
                const list = await api.listGroups(token);
                setGroups(list);
                if (list.length && !activeGroupId)
                    setActiveGroupId(list[0].id);
            }
            finally {
                setLoading(false);
            }
        })();
    }, []);
    async function refreshActiveGroup() {
        if (!activeGroupId)
            return;
        const token = await getAccessToken();
        const full = await api.getGroup(token, activeGroupId);
        setGroups((prev) => prev.map((g) => (g.id === activeGroupId ? full : g)));
    }
    useEffect(() => {
        refreshActiveGroup();
        const interval = setInterval(refreshActiveGroup, 5000);
        return () => clearInterval(interval);
    }, [activeGroupId]);
    // TODO backend: reemplazar esto por datos reales. Hoy no existe un
    // endpoint que devuelva "cuánto depositó ESTE usuario en cada grupo" —
    // el contrato emite el evento Deposit, pero nadie lo está agregando
    // todavía. La forma más simple de resolverlo: que el RelayerService
    // escuche ese evento (o lo lea con contract.queryFilter) y lo guarde en
    // una tabla `deposits` en Postgres, y exponer GET /users/me/stats.
    // Mientras tanto, usamos el balance actual de cada grupo como aproximación.
    const stats = useMemo(() => groups.map((g) => ({ groupName: g.name, amountDeposited: Number(g.balance || 0) })), [groups]);
    const maxStat = Math.max(1, ...stats.map((s) => s.amountDeposited));
    const totalBalance = groups.reduce((sum, g) => sum + Number(g.balance || 0), 0);
    const totalPending = groups.reduce((sum, g) => sum + (g.pending?.length || 0), 0);
    const initials = (displayName || "U")
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    async function handleSaveName() {
        setSavingName(true);
        setNameSaved(false);
        try {
            // TODO backend: hoy no existe PATCH /users/me. Hay que agregar ese
            // endpoint en UsersController (actualiza la columna `name` de User)
            // y llamarlo acá, por ejemplo: await api.updateProfile(token, { name: displayName })
            await new Promise((r) => setTimeout(r, 400)); // simulado
            setNameSaved(true);
        }
        finally {
            setSavingName(false);
        }
    }
    async function withSignature(primaryType, message, action) {
        if (!embeddedWallet || !activeGroup)
            throw new Error("Wallet o grupo no listos");
        const token = await getAccessToken();
        const { nonce } = await api.getNonce(token, activeGroup.id);
        const signature = await signTyped(embeddedWallet, primaryType, activeGroup.contractAddress, {
            ...message,
            nonce,
        });
        return action(nonce, signature);
    }
    async function handleDeposit(fiatAmount) {
        if (!activeGroup) {
            setError("Selecciona un grupo primero");
            return;
        }
        if (fiatAmount <= 0) {
            setError("El monto debe ser mayor a 0");
            return;
        }
        setIsSubmitting(true);
        setError("");
        try {
            const token = await getAccessToken();
            await api.deposit(token, activeGroup.id, fiatAmount);
            setSheet(null);
            setSuccessMessage("¡Dinero ingresado exitosamente!");
            setTimeout(() => setSuccessMessage(""), 3000);
            refreshActiveGroup();
        }
        catch (e) {
            setError(e.message || "Error al ingresar dinero");
        }
        finally {
            setIsSubmitting(false);
        }
    }
    async function handleSpend(amount, desc, forceApproval) {
        if (!activeGroup) {
            setError("Selecciona un grupo primero");
            return;
        }
        if (amount <= 0) {
            setError("El monto debe ser mayor a 0");
            return;
        }
        if (!desc.trim()) {
            setError("La descripción es requerida");
            return;
        }
        setIsSubmitting(true);
        setError("");
        try {
            const token = await getAccessToken();
            await withSignature("RequestExpense", { user: embeddedWallet.address, amount: toWei(amount.toString()), desc, forceApproval }, (nonce, signature) => api.requestExpense(token, activeGroup.id, { amountMon: amount.toString(), desc, forceApproval, nonce, signature }));
            setSheet(null);
            setSuccessMessage(forceApproval ? "¡Solicitud enviada!" : "¡Gasto registrado!");
            setTimeout(() => setSuccessMessage(""), 3000);
            refreshActiveGroup();
        }
        catch (e) {
            setError(e.message || "Error al registrar el gasto");
        }
        finally {
            setIsSubmitting(false);
        }
    }
    async function handleVote(txId, approve) {
        if (!activeGroup) {
            setError("Selecciona un grupo primero");
            return;
        }
        setIsSubmitting(true);
        setError("");
        try {
            const token = await getAccessToken();
            await withSignature("Vote", { voter: embeddedWallet.address, txId, approve }, (nonce, signature) => api.vote(token, activeGroup.id, { txId, approve, nonce, signature }));
            setSuccessMessage(approve ? "¡Voto registrado!" : "¡Voto rechazado!");
            setTimeout(() => setSuccessMessage(""), 3000);
            refreshActiveGroup();
        }
        catch (e) {
            setError(e.message || "Error al registrar voto");
        }
        finally {
            setIsSubmitting(false);
        }
    }
    async function handleNewGroup(name, creditLimit) {
        if (!name.trim()) {
            setError("El nombre del grupo es requerido");
            return;
        }
        if (Number(creditLimit) <= 0) {
            setError("El límite debe ser mayor a 0");
            return;
        }
        setIsSubmitting(true);
        setError("");
        try {
            const token = await getAccessToken();
            const g = await api.createGroup(token, { name, creditLimit, dailyLimit: 2 });
            setSheet(null);
            setActiveGroupId(g.id);
            setSuccessMessage("¡Grupo creado exitosamente!");
            setTimeout(() => setSuccessMessage(""), 3000);
            const list = await api.listGroups(token);
            setGroups(list);
        }
        catch (e) {
            setError(e.message || "Error al crear grupo");
        }
        finally {
            setIsSubmitting(false);
        }
    }
    function handleGroupDetail(group) {
        setSelectedGroupForDetail(group);
        setActiveGroupId(group.id);
        setCurrentView("groupDetail");
    }
    function handleBackToDashboard() {
        setCurrentView("dashboard");
        setSelectedGroupForDetail(null);
    }
    function handleGroupChangeFromDetail(groupId) {
        setActiveGroupId(groupId);
        const updatedGroup = groups.find(g => g.id === groupId);
        if (updatedGroup) {
            setSelectedGroupForDetail(updatedGroup);
        }
    }
    function NavItem({ tab, label, icon }) {
        return (_jsxs("div", { className: `dash-nav-item ${activeTab === tab ? "dash-nav-item-active" : ""}`, onClick: () => {
                setActiveTab(tab);
                setSidebarOpen(false); // en mobile, al elegir una sección se cierra el panel
            }, children: [_jsx("span", { className: "dash-nav-icon", children: icon }), _jsx("span", { className: "dash-nav-label", children: label })] }));
    }
    return (_jsxs("div", { className: "dash-layout", children: [_jsx("button", { className: "dash-mobile-toggle", onClick: () => setSidebarOpen(!sidebarOpen), children: sidebarOpen ? "✕" : "☰" }), sidebarOpen && _jsx("div", { className: "dash-sidebar-overlay", onClick: () => setSidebarOpen(false) }), _jsxs("aside", { className: `dash-sidebar ${sidebarOpen ? "dash-sidebar-open" : ""}`, children: [_jsxs("div", { className: "dash-sidebar-header", children: [_jsx("div", { className: "dash-avatar", children: initials }), _jsxs("div", { children: [_jsx("div", { className: "dash-user-name", children: displayName || "Usuario" }), _jsx("div", { className: "dash-user-email", children: user?.email?.address })] })] }), _jsxs("nav", { className: "dash-nav", children: [_jsx(NavItem, { tab: "resumen", label: "Resumen", icon: "\uD83C\uDFE0" }), _jsx(NavItem, { tab: "grupos", label: "Mis grupos", icon: "\uD83D\uDC65" }), _jsx(NavItem, { tab: "estadisticas", label: "Estad\u00EDsticas", icon: "\uD83D\uDCCA" }), _jsx(NavItem, { tab: "configuracion", label: "Configuraci\u00F3n", icon: "\u2699\uFE0F" })] }), _jsx("div", { className: "dash-sidebar-footer", children: _jsx("button", { className: "dash-logout-btn", onClick: logout, children: "Cerrar sesi\u00F3n" }) })] }), _jsxs("main", { className: "dash-content", children: [loading && _jsx("p", { className: "dash-hint", children: "Cargando tus datos..." }), !loading && currentView === "dashboard" && (_jsxs(_Fragment, { children: [successMessage && (_jsxs("div", { className: "dash-success-message", children: [_jsx("span", { className: "dash-success-icon", children: "\u2713" }), _jsx("span", { children: successMessage })] })), groups.length > 0 && (_jsx("div", { className: "dash-quick-actions", children: _jsxs("button", { className: "dash-action-btn dash-action-new-group", onClick: () => setSheet("newGroup"), title: "Crear nuevo grupo", children: [_jsx("span", { className: "dash-action-icon", children: "\uD83D\uDC65" }), _jsx("span", { className: "dash-action-label", children: "Nuevo grupo" })] }) })), groups.length === 0 && (_jsxs("div", { className: "dash-empty-state-premium", children: [_jsx("div", { className: "dash-empty-icon", children: "\uD83D\uDE80" }), _jsx("h2", { className: "dash-section-title", children: "\u00A1Bienvenido a Fondo Com\u00FAn!" }), _jsx("p", { className: "dash-hint", children: "Crea tu primer grupo para comenzar a gestionar tus finanzas compartidas de forma segura y transparente." }), _jsxs("button", { className: "btn btn-gold dash-cta-button", onClick: () => setSheet("newGroup"), children: [_jsx("span", { className: "dash-cta-icon", children: "\u2728" }), _jsx("span", { children: "Crear mi primer grupo" })] })] })), activeTab === "resumen" && (_jsx(ResumenTab, { totalBalance: totalBalance, totalGroups: groups.length, totalPending: totalPending })), activeTab === "grupos" && _jsx(GruposTab, { groups: groups, activeGroupId: activeGroupId, onSelectGroup: setActiveGroupId, onOpenNewGroupSheet: () => setSheet("newGroup"), onGroupDetail: handleGroupDetail }), activeTab === "estadisticas" && _jsx(EstadisticasTab, { stats: stats, maxStat: maxStat }), activeTab === "configuracion" && (_jsx(ConfiguracionTab, { displayName: displayName, setDisplayName: setDisplayName, onSave: handleSaveName, saving: savingName, saved: nameSaved })), _jsx(Sheet, { open: sheet === "deposit", onClose: () => setSheet(null), children: _jsx(DepositForm, { onSubmit: handleDeposit, error: error, isSubmitting: isSubmitting }) }), _jsx(Sheet, { open: sheet === "spend", onClose: () => setSheet(null), children: _jsx(SpendForm, { creditLimit: activeGroup ? Number(activeGroup.creditLimit) : Infinity, error: error, isSubmitting: isSubmitting, onSubmit: (a, d) => handleSpend(a, d, false) }) }), _jsx(Sheet, { open: sheet === "request", onClose: () => setSheet(null), children: _jsx(SpendForm, { creditLimit: Infinity, error: error, isSubmitting: isSubmitting, danger: true, onSubmit: (a, d) => handleSpend(a, d, true) }) }), _jsx(Sheet, { open: sheet === "newGroup", onClose: () => setSheet(null), children: _jsx(NewGroupForm, { onSubmit: handleNewGroup, error: error, isSubmitting: isSubmitting }) })] })), !loading && currentView === "groupDetail" && selectedGroupForDetail && (_jsx(GroupDetail, { group: selectedGroupForDetail, groups: groups, onBack: handleBackToDashboard, onGroupChange: handleGroupChangeFromDetail, sheet: sheet, setSheet: setSheet, error: error, isSubmitting: isSubmitting, successMessage: successMessage, onDeposit: handleDeposit, onSpend: handleSpend, onVote: handleVote, onNewGroup: handleNewGroup }))] })] }));
}
// ---------------------------------------------------------------------
// Resumen: lo primero que ve el usuario al entrar. Una foto general de
// todos sus grupos junta, no de uno solo.
// ---------------------------------------------------------------------
function ResumenTab({ totalBalance, totalGroups, totalPending, }) {
    const fmt = (n) => "$" + Math.round(n).toLocaleString("es-AR");
    return (_jsxs("div", { children: [_jsx("h2", { className: "dash-section-title", children: "Resumen general" }), _jsxs("div", { className: "dash-summary-row", children: [_jsxs("div", { className: "dash-summary-card", children: [_jsx("div", { className: "dash-summary-value", children: fmt(totalBalance) }), _jsx("div", { className: "dash-summary-label", children: "Fondo total (todos tus grupos)" })] }), _jsxs("div", { className: "dash-summary-card", children: [_jsx("div", { className: "dash-summary-value", children: totalGroups }), _jsx("div", { className: "dash-summary-label", children: "Grupos activos" })] }), _jsxs("div", { className: "dash-summary-card", children: [_jsx("div", { className: "dash-summary-value", children: totalPending }), _jsx("div", { className: "dash-summary-label", children: "Solicitudes esperando tu voto" })] })] })] }));
}
// ---------------------------------------------------------------------
// Mis grupos: la lista completa, no solo el que tenés seleccionado.
// ---------------------------------------------------------------------
function GruposTab({ groups, activeGroupId, onSelectGroup, onOpenNewGroupSheet, onGroupDetail }) {
    const fmt = (n) => "$" + Math.round(n).toLocaleString("es-AR");
    if (groups.length === 0) {
        return (_jsxs("div", { className: "dash-empty-state-premium", children: [_jsx("div", { className: "dash-empty-icon", children: "\uD83D\uDC65" }), _jsx("h2", { className: "dash-section-title", children: "\u00A1Crea tu primer grupo!" }), _jsx("p", { className: "dash-hint", children: "Comienza a gestionar tus finanzas compartidas creando un grupo para viajes, comidas o gastos en com\u00FAn." }), _jsxs("button", { className: "btn btn-gold dash-cta-button", onClick: onOpenNewGroupSheet, children: [_jsx("span", { className: "dash-cta-icon", children: "\u2728" }), _jsx("span", { children: "Crear grupo ahora" })] })] }));
    }
    return (_jsxs("div", { children: [_jsx("h2", { className: "dash-section-title", children: "Mis grupos" }), _jsx("div", { className: "dash-group-list", children: groups.map((g) => (_jsxs("div", { className: `dash-group-card ${g.id === activeGroupId ? "dash-group-card-active" : ""}`, onClick: () => onGroupDetail(g), children: [_jsxs("div", { className: "dash-group-card-main", children: [_jsx("div", { className: "dash-group-card-name", children: g.name }), _jsxs("div", { className: "dash-group-card-meta", children: ["L\u00EDmite por gasto: ", fmt(Number(g.creditLimit)), " \u00B7 ", g.dailyLimit, " por d\u00EDa"] })] }), _jsx("div", { className: "dash-group-card-balance", children: fmt(Number(g.balance || 0)) }), _jsx("div", { className: "dash-group-card-action", children: _jsx("span", { className: "dash-group-card-action-text", children: "Ver detalles \u2192" }) })] }, g.id))) })] }));
}
// ---------------------------------------------------------------------
// Estadísticas: un grafico de barras simple hecho con SVG (no depende de
// ninguna libreria ni de CSS para dibujarse, solo geometria).
// ---------------------------------------------------------------------
function EstadisticasTab({ stats, maxStat }) {
    const fmt = (n) => "$" + Math.round(n).toLocaleString("es-AR");
    const barHeight = 28;
    const gap = 14;
    const chartWidth = 400;
    if (stats.length === 0) {
        return _jsx("p", { className: "dash-hint", children: "Todav\u00EDa no hay datos suficientes para mostrar estad\u00EDsticas." });
    }
    return (_jsxs("div", { children: [_jsx("h2", { className: "dash-section-title", children: "En qu\u00E9 grupos pusiste m\u00E1s plata" }), _jsxs("svg", { className: "dash-chart", viewBox: `0 0 ${chartWidth} ${stats.length * (barHeight + gap)}`, width: "100%", children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "chartGradient", x1: "0%", y1: "0%", x2: "100%", y2: "0%", children: [_jsx("stop", { offset: "0%", stopColor: "#00D8C0" }), _jsx("stop", { offset: "100%", stopColor: "#FFD700" })] }) }), stats.map((s, i) => {
                        const barWidth = (s.amountDeposited / maxStat) * (chartWidth - 120);
                        const y = i * (barHeight + gap);
                        return (_jsxs("g", { children: [_jsx("text", { x: 0, y: y + barHeight / 2 + 4, className: "dash-chart-label", children: s.groupName }), _jsx("rect", { x: 120, y: y, width: Math.max(barWidth, 2), height: barHeight, rx: 6, className: "dash-chart-bar" }), _jsx("text", { x: 120 + barWidth + 8, y: y + barHeight / 2 + 4, className: "dash-chart-value", children: fmt(s.amountDeposited) })] }, s.groupName));
                    })] }), _jsx("p", { className: "dash-hint dash-chart-note", children: "Por ahora este n\u00FAmero muestra el fondo actual del grupo, no el total hist\u00F3rico que depositaste \u2014 falta un endpoint en el backend que sume tus dep\u00F3sitos reales (ver comentario en el c\u00F3digo)." })] }));
}
// ---------------------------------------------------------------------
// Configuración: por ahora solo el cambio de nombre, como pediste.
// ---------------------------------------------------------------------
function ConfiguracionTab({ displayName, setDisplayName, onSave, saving, saved, }) {
    return (_jsxs("div", { children: [_jsx("h2", { className: "dash-section-title", children: "Configuraci\u00F3n" }), _jsxs("div", { className: "dash-settings-card", children: [_jsx("label", { className: "dash-label", children: "Nombre para mostrar" }), _jsx("input", { className: "dash-input", value: displayName, onChange: (e) => setDisplayName(e.target.value), placeholder: "Tu nombre" }), _jsx("button", { className: "btn btn-gold", onClick: onSave, disabled: saving, children: saving ? "Guardando..." : "Guardar cambios" }), saved && _jsx("p", { className: "dash-hint dash-saved-msg", children: "Guardado \u2713" })] })] }));
}

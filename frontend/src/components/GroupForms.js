import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { api } from "../lib/api";
import toast from "react-hot-toast";
import { signTyped, toWei } from "../lib/eip712";
// Helpers para montos (simulando 1 MON = $1000 ARS)
const FIAT_TO_MON = 1000;
const monToFiat = (mon) => mon * FIAT_TO_MON;
const fiatToMon = (fiat) => fiat / FIAT_TO_MON;
export default function GroupForms({ type, group, onSuccess, onCancel }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { user, getAccessToken } = usePrivy();
    const { wallets } = useWallets();
    const handleCreateGroup = async (name, limitFiat) => {
        let tid;
        try {
            setLoading(true);
            setError("");
            const token = await getAccessToken();
            if (!token)
                throw new Error("No autenticado");
            tid = toast.loading("Creando grupo en Monad...");
            const start = Date.now();
            await api.createGroup(token, {
                name,
                creditLimit: String(fiatToMon(limitFiat)),
                dailyLimit: 0
            });
            const end = Date.now();
            toast.success(`¡Grupo creado en ${(end - start) / 1000}s! ⚡️`, { id: tid });
            onSuccess();
        }
        catch (err) {
            setError(err.message);
            if (tid)
                toast.dismiss(tid);
        }
        finally {
            setLoading(false);
        }
    };
    const handleDeposit = async (amountFiat) => {
        if (!group)
            return;
        let tid;
        try {
            setLoading(true);
            setError("");
            const token = await getAccessToken();
            if (!token)
                throw new Error("No autenticado");
            tid = toast.loading("Confirmando depósito en Monad...");
            const start = Date.now();
            await api.deposit(token, group.id, amountFiat);
            const end = Date.now();
            toast.success(`¡Depósito exitoso en ${(end - start) / 1000}s! ⚡️`, { id: tid });
            onSuccess();
        }
        catch (err) {
            setError(err.message);
            if (tid)
                toast.dismiss(tid);
        }
        finally {
            setLoading(false);
        }
    };
    const handleSpend = async (amountFiat, desc) => {
        if (!group)
            return;
        try {
            setLoading(true);
            setError("");
            const token = await getAccessToken();
            if (!token)
                throw new Error("No autenticado");
            const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
            if (!embeddedWallet)
                throw new Error("Wallet no encontrada");
            const { nonce } = await api.getNonce(token, group.id);
            const forceApproval = amountFiat > monToFiat(Number(group.creditLimit));
            const amountMon = String(fiatToMon(amountFiat));
            const message = {
                user: user?.wallet?.address,
                amount: toWei(amountMon), // Convert to wei for contract
                desc,
                forceApproval,
                nonce: parseInt(nonce, 10)
            };
            const signature = await signTyped(embeddedWallet, "RequestExpense", group.contractAddress, message);
            const tid = toast.loading("Procesando transacción...");
            const start = Date.now();
            await api.requestExpense(token, group.id, {
                amountMon,
                desc,
                forceApproval,
                nonce,
                signature
            });
            const end = Date.now();
            toast.success(`¡Gasto solicitado en ${(end - start) / 1000}s! ⚡️`, { id: tid });
            onSuccess();
        }
        catch (err) {
            setError(err.message);
            toast.dismiss();
        }
        finally {
            setLoading(false);
        }
    };
    const handleJoin = async () => {
        if (!group)
            return;
        try {
            setLoading(true);
            setError("");
            const token = await getAccessToken();
            if (!token)
                throw new Error("No autenticado");
            const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
            if (!embeddedWallet)
                throw new Error("Wallet no encontrada");
            const { nonce } = await api.getNonce(token, group.id);
            const message = {
                user: user?.wallet?.address,
                nonce: parseInt(nonce, 10)
            };
            const signature = await signTyped(embeddedWallet, "Join", group.contractAddress, message);
            const tid = toast.loading("Registrando en Monad...");
            const start = Date.now();
            await api.join(token, group.id, {
                nonce,
                signature
            });
            const end = Date.now();
            toast.success(`¡Te uniste en ${(end - start) / 1000}s! ⚡️`, { id: tid });
            onSuccess();
        }
        catch (err) {
            setError(err.message);
            toast.dismiss();
        }
        finally {
            setLoading(false);
        }
    };
    if (type === "new_group")
        return _jsx(NewGroupForm, { onSubmit: handleCreateGroup, error: error, loading: loading });
    if (type === "deposit")
        return _jsx(DepositForm, { onSubmit: handleDeposit, error: error, loading: loading });
    if (type === "join_group")
        return (_jsxs("div", { style: { textAlign: "center", padding: "20px 0" }, children: [_jsxs("p", { style: { marginBottom: "20px" }, children: ["\u00BFQuieres unirte al grupo ", _jsx("strong", { children: group?.name }), "?"] }), error && _jsx("div", { className: "error-msg", children: error }), _jsx("button", { className: "btn-primary", style: { width: "100%" }, onClick: handleJoin, disabled: loading, children: loading ? "Uniendo..." : "Unirme al Grupo" })] }));
    if (type === "spend") {
        const limit = group ? monToFiat(Number(group.creditLimit)) : 0;
        return _jsx(SpendForm, { limit: limit, onSubmit: handleSpend, error: error, loading: loading });
    }
    return null;
}
// ------------------------------------------------------------
// FORMS INTERNOS
// ------------------------------------------------------------
function DepositForm({ onSubmit, error, loading }) {
    const [amount, setAmount] = useState("");
    const [step, setStep] = useState(1);
    return (_jsx("div", { children: step === 1 ? (_jsxs(_Fragment, { children: [_jsx("p", { style: { color: "var(--text-muted)", marginBottom: "24px" }, children: "Ingresa el monto para generar un c\u00F3digo de pago o abonar mediante transferencia." }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Monto a ingresar (ARS)" }), _jsx("input", { className: "form-input", type: "number", placeholder: "$0", value: amount, onChange: e => setAmount(e.target.value) })] }), error && _jsx("div", { className: "error-msg", children: error }), _jsx("button", { className: "btn-primary", style: { width: "100%", marginTop: "16px" }, onClick: () => setStep(2), children: "Generar c\u00F3digo de pago" })] })) : (_jsxs("div", { className: "text-center", children: [_jsx("p", { style: { color: "var(--text-muted)", marginBottom: "16px" }, children: "C\u00F3digo para dep\u00F3sito en efectivo (Rapipago/PagoF\u00E1cil):" }), _jsx("h2", { style: { fontSize: "2.5rem", letterSpacing: "4px", margin: "0 0 24px" }, children: "928374" }), _jsx("p", { style: { color: "var(--text-muted)", marginBottom: "24px", fontSize: "0.85rem" }, children: "O si prefieres pago digital, simula tu dep\u00F3sito con Mercado Pago." }), _jsx("button", { style: {
                        width: "100%",
                        backgroundColor: "#009EE3",
                        color: "white",
                        border: "none",
                        padding: "16px",
                        borderRadius: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        marginBottom: "12px",
                        fontFamily: "inherit",
                        fontSize: "1rem"
                    }, onClick: () => {
                        window.open("https://www.mercadopago.com.ar", "_blank");
                        onSubmit(Number(amount));
                    }, disabled: loading, children: loading ? "Procesando el pago..." : "Pagar con Mercado Pago" }), _jsx("button", { className: "btn-primary", style: { width: "100%", marginTop: "8px" }, onClick: () => onSubmit(Number(amount)), disabled: loading, children: loading ? "Cargando..." : "Simular depósito de prueba" })] })) }));
}
function SpendForm({ limit, onSubmit, error, loading }) {
    const [amount, setAmount] = useState("");
    const [desc, setDesc] = useState("");
    const numAmount = Number(amount);
    const exceeds = numAmount > limit;
    return (_jsxs("div", { children: [_jsxs("p", { style: { color: "var(--text-muted)", marginBottom: "24px" }, children: ["L\u00EDmite de gasto directo: ", _jsxs("strong", { children: ["$", limit.toLocaleString("es-AR")] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Monto (ARS)" }), _jsx("input", { className: "form-input", type: "number", placeholder: "$0", value: amount, onChange: e => setAmount(e.target.value) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Descripci\u00F3n" }), _jsx("input", { className: "form-input", type: "text", placeholder: "Ej: Pizza viernes", value: desc, onChange: e => setDesc(e.target.value) })] }), exceeds && amount !== "" && (_jsxs("div", { style: { background: "var(--danger-light)", color: "var(--danger)", padding: "12px", borderRadius: "12px", fontSize: "0.85rem", marginBottom: "20px" }, children: ["Al superar el l\u00EDmite libre de $", limit, ", este gasto pasar\u00E1 a ", _jsx("strong", { children: "Votaci\u00F3n Mayoritaria" }), "."] })), error && _jsx("div", { className: "error-msg", children: error }), _jsx("button", { className: "btn-primary", style: { width: "100%", marginTop: "16px" }, onClick: () => onSubmit(numAmount, desc), disabled: loading, children: loading ? "Procesando..." : (exceeds ? "Pedir Aprobación" : "Gastar directamente") })] }));
}
function NewGroupForm({ onSubmit, error, loading }) {
    const [name, setName] = useState("");
    const [limit, setLimit] = useState("");
    return (_jsxs("div", { children: [_jsx("p", { style: { color: "var(--text-muted)", marginBottom: "24px" }, children: "Crea un nuevo fondo com\u00FAn e invita a tus amigos o familiares." }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Nombre del grupo" }), _jsx("input", { className: "form-input", type: "text", placeholder: "Ej: Viaje Bariloche", value: name, onChange: e => setName(e.target.value) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "L\u00EDmite libre de gasto (ARS)" }), _jsx("input", { className: "form-input", type: "number", placeholder: "Ej: 5000", value: limit, onChange: e => setLimit(e.target.value) }), _jsx("div", { style: { fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }, children: "Cualquier monto superior requerir\u00E1 aprobaci\u00F3n del grupo." })] }), error && _jsx("div", { className: "error-msg", children: error }), _jsx("button", { className: "btn-primary", style: { width: "100%", marginTop: "16px" }, onClick: () => onSubmit(name, Number(limit)), disabled: loading, children: loading ? "Creando en Monad..." : "Crear Grupo" })] }));
}

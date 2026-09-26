import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
// Conversión del usuario: pesos -> MON.
// Ejemplo: 2000 pesos = 2 MON.
const FIAT_TO_MON_RATE = 1000;
const fiatToMon = (fiatAmount) => Number(fiatAmount) / FIAT_TO_MON_RATE;
const formatMonEquivalent = (fiatAmount) => {
    const value = Number(fiatAmount);
    if (!fiatAmount || !Number.isFinite(value) || value <= 0)
        return "";
    const monAmount = fiatToMon(value);
    return `${monAmount.toLocaleString("es-AR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4,
    })} MON`;
};
// Formularios centralizados para evitar duplicación de código
// Estos formularios se importan tanto en UserDashboard como en GroupDetail
export function DepositForm({ onSubmit, error, isSubmitting }) {
    const [amount, setAmount] = useState("");
    const [localError, setLocalError] = useState("");
    const handleSubmit = () => {
        if (!amount || Number(amount) <= 0) {
            setLocalError("Ingresa un monto válido");
            return;
        }
        setLocalError("");
        onSubmit(Number(amount));
    };
    const monEquivalent = formatMonEquivalent(amount);
    return (_jsxs(_Fragment, { children: [_jsx("h3", { className: "dash-form-title", children: "Ingresar dinero" }), _jsx("p", { className: "hint", children: "Transfer\u00ED desde tu cuenta bancaria o Mercado Pago. Se acredita al instante en el fondo del grupo." }), _jsxs("div", { className: "dash-amount-input-wrap", children: [_jsx("input", { className: `dash-input ${localError || error ? 'dash-input-error' : ''}`, type: "number", placeholder: "Monto a ingresar", value: amount, onChange: (e) => setAmount(e.target.value) }), monEquivalent && (_jsxs("div", { className: "dash-amount-equivalent", children: ["Corresponde a ", _jsx("span", { children: monEquivalent })] }))] }), (localError || error) && _jsx("div", { className: "dash-field-error", children: localError || error }), _jsx("button", { className: "btn btn-gold", onClick: handleSubmit, disabled: isSubmitting, children: isSubmitting ? "Procesando..." : "Confirmar ingreso" })] }));
}
export function SpendForm({ creditLimit, error, danger, isSubmitting, onSubmit, }) {
    const [amount, setAmount] = useState("");
    const [desc, setDesc] = useState("");
    const [localError, setLocalError] = useState("");
    const handleSubmit = () => {
        if (!amount || Number(amount) <= 0) {
            setLocalError("Ingresa un monto válido");
            return;
        }
        if (!desc.trim()) {
            setLocalError("La descripción es requerida");
            return;
        }
        setLocalError("");
        onSubmit(Number(amount), desc);
    };
    const monEquivalent = formatMonEquivalent(amount);
    return (_jsxs(_Fragment, { children: [_jsx("h3", { className: "dash-form-title", children: danger ? "Pedir un monto mayor" : "Registrar gasto" }), _jsx("p", { className: "hint", children: danger
                    ? "Esto le llega como notificación a todo el grupo y necesita mayoría de votos."
                    : `Hasta ${creditLimit === Infinity ? "" : "$" + creditLimit} sin aprobación.` }), _jsxs("div", { className: "dash-amount-input-wrap", children: [_jsx("input", { className: `dash-input ${localError || error ? 'dash-input-error' : ''}`, type: "number", placeholder: "Monto", value: amount, onChange: (e) => setAmount(e.target.value) }), monEquivalent && (_jsxs("div", { className: "dash-amount-equivalent", children: ["Corresponde a ", _jsx("span", { children: monEquivalent })] }))] }), _jsx("input", { className: `dash-input ${localError || error ? 'dash-input-error' : ''}`, type: "text", placeholder: "Descripci\u00F3n", value: desc, onChange: (e) => setDesc(e.target.value) }), (localError || error) && _jsx("div", { className: "dash-field-error", children: localError || error }), _jsx("button", { className: `btn ${danger ? "btn-danger" : "btn-gold"}`, onClick: handleSubmit, disabled: isSubmitting, children: isSubmitting ? "Procesando..." : (danger ? "Enviar solicitud" : "Registrar") })] }));
}
export function NewGroupForm({ onSubmit, error, isSubmitting }) {
    const [name, setName] = useState("");
    const [limit, setLimit] = useState("10000");
    const [localError, setLocalError] = useState("");
    const handleSubmit = () => {
        if (!name.trim()) {
            setLocalError("El nombre del grupo es requerido");
            return;
        }
        if (!limit || Number(limit) <= 0) {
            setLocalError("El límite debe ser mayor a 0");
            return;
        }
        setLocalError("");
        onSubmit(name, limit);
    };
    return (_jsxs(_Fragment, { children: [_jsx("h3", { className: "dash-form-title", children: "Crear nuevo grupo" }), _jsx("p", { className: "hint", children: "Despu\u00E9s le compart\u00EDs el link de invitaci\u00F3n a quien quieras sumar." }), _jsx("input", { className: `dash-input ${localError || error ? 'dash-input-error' : ''}`, type: "text", placeholder: "Nombre del grupo", value: name, onChange: (e) => setName(e.target.value) }), _jsx("input", { className: `dash-input ${localError || error ? 'dash-input-error' : ''}`, type: "number", placeholder: "M\u00E1ximo por gasto ($)", value: limit, onChange: (e) => setLimit(e.target.value) }), (localError || error) && _jsx("div", { className: "dash-field-error", children: localError || error }), _jsx("button", { className: "btn btn-gold", onClick: handleSubmit, disabled: isSubmitting, children: isSubmitting ? "Creando..." : "Crear grupo" })] }));
}

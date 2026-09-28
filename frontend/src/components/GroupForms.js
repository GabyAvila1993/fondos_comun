import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
// Conversión del usuario: pesos -> MON.
// Ejemplo: 2000 pesos = 2 MON.
const FIAT_TO_MON_RATE = 1000;
const fiatToMon = (fiatAmount) => Number(fiatAmount) / FIAT_TO_MON_RATE;
// Formularios centralizados para evitar duplicación de código
// Estos formularios se importan tanto en UserDashboard como en GroupDetail
export function DepositForm({ onSubmit, error, isSubmitting }) {
    const [amount, setAmount] = useState("");
    const [localError, setLocalError] = useState("");
    const [showPaymentInfo, setShowPaymentInfo] = useState(false);
    const [paymentCode, setPaymentCode] = useState("");
    const handleSubmit = () => {
        if (!amount || Number(amount) <= 0) {
            setLocalError("Ingresa un monto válido");
            return;
        }
        setLocalError("");
        setPaymentCode(Math.floor(100000000 + Math.random() * 900000000).toString());
        setShowPaymentInfo(true);
    };
    const handleConfirmPayment = () => {
        onSubmit(Number(amount));
    };
    return (_jsxs(_Fragment, { children: [_jsx("h3", { className: "dash-form-title", children: "Ingresar fondos" }), !showPaymentInfo ? (_jsxs(_Fragment, { children: [_jsx("p", { className: "hint", children: "Ingrese el monto para generar un c\u00F3digo de pago o abonar mediante Mercado Pago." }), _jsx("div", { className: "dash-amount-input-wrap", children: _jsx("input", { className: `dash-input ${localError || error ? 'dash-input-error' : ''}`, type: "number", placeholder: "Monto a ingresar", value: amount, onChange: (e) => setAmount(e.target.value) }) }), (localError || error) && _jsx("div", { className: "dash-field-error", children: localError || error }), _jsx("button", { className: "btn btn-gold", onClick: handleSubmit, disabled: isSubmitting, children: "Continuar al pago" })] })) : (_jsxs("div", { style: { textAlign: "center", display: "flex", flexDirection: "column", gap: "1rem" }, children: [_jsx("p", { children: "Tu c\u00F3digo de pago en sucursal es:" }), _jsx("h2", { style: { letterSpacing: "2px", margin: "0" }, children: paymentCode }), _jsx("p", { className: "hint", children: "O si prefieres, simula el pago digital ahora:" }), _jsx("button", { className: "btn btn-gold", onClick: handleConfirmPayment, disabled: isSubmitting, children: isSubmitting ? "Procesando..." : "Simular pago con Mercado Pago" })] }))] }));
}
export function SpendForm({ creditLimit, error, danger, isSubmitting, onSubmit, }) {
    const [amount, setAmount] = useState("");
    const [desc, setDesc] = useState("");
    const [cvu, setCvu] = useState("");
    const [localError, setLocalError] = useState("");
    const handleSubmit = () => {
        if (!amount || Number(amount) <= 0) {
            setLocalError("Ingresa un monto válido");
            return;
        }
        if (!cvu.trim()) {
            setLocalError("El Alias o CVU es requerido");
            return;
        }
        if (!desc.trim()) {
            setLocalError("La descripción es requerida");
            return;
        }
        setLocalError("");
        onSubmit(Number(amount), `CVU/Alias: ${cvu} - ${desc}`);
    };
    return (_jsxs(_Fragment, { children: [_jsx("h3", { className: "dash-form-title", children: danger ? "Solicitar transferencia especial" : "Transferir fondos" }), _jsx("p", { className: "hint", children: danger
                    ? "Esta operación requiere la aprobación por mayoría de los integrantes del grupo."
                    : "Transfiera los fondos a una cuenta bancaria indicando el CVU o Alias correspondiente." }), _jsx("div", { className: "dash-amount-input-wrap", children: _jsx("input", { className: `dash-input ${localError || error ? 'dash-input-error' : ''}`, type: "number", placeholder: "Monto", value: amount, onChange: (e) => setAmount(e.target.value) }) }), _jsx("input", { className: `dash-input ${localError || error ? 'dash-input-error' : ''}`, type: "text", placeholder: "Alias o CVU", value: cvu, onChange: (e) => setCvu(e.target.value) }), _jsx("input", { className: `dash-input ${localError || error ? 'dash-input-error' : ''}`, type: "text", placeholder: "Descripci\u00F3n del retiro", value: desc, onChange: (e) => setDesc(e.target.value) }), (localError || error) && _jsx("div", { className: "dash-field-error", children: localError || error }), _jsx("button", { className: `btn ${danger ? "btn-danger" : "btn-gold"}`, onClick: handleSubmit, disabled: isSubmitting, children: isSubmitting ? "Procesando..." : (danger ? "Enviar solicitud" : "Confirmar transferencia") })] }));
}
export function NewGroupForm({ onSubmit, error, isSubmitting }) {
    const [name, setName] = useState("");
    const [localError, setLocalError] = useState("");
    const handleSubmit = () => {
        if (!name.trim()) {
            setLocalError("El nombre del grupo es requerido");
            return;
        }
        setLocalError("");
        // Se pasa un límite infinito por defecto ya que las restricciones no aplican
        onSubmit(name, "1000000000");
    };
    return (_jsxs(_Fragment, { children: [_jsx("h3", { className: "dash-form-title", children: "Crear nuevo fondo com\u00FAn" }), _jsx("p", { className: "hint", children: "Una vez creado, podr\u00E1 compartir el enlace de invitaci\u00F3n con los dem\u00E1s integrantes." }), _jsx("input", { className: `dash-input ${localError || error ? 'dash-input-error' : ''}`, type: "text", placeholder: "Nombre del grupo", value: name, onChange: (e) => setName(e.target.value) }), (localError || error) && _jsx("div", { className: "dash-field-error", children: localError || error }), _jsx("button", { className: "btn btn-gold", onClick: handleSubmit, disabled: isSubmitting, children: isSubmitting ? "Creando..." : "Crear grupo" })] }));
}

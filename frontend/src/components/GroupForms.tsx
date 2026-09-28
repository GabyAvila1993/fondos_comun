import { useState } from "react";

// Conversión del usuario: pesos -> MON.
// Ejemplo: 2000 pesos = 2 MON.
const FIAT_TO_MON_RATE = 1000;

const fiatToMon = (fiatAmount: number) => Number(fiatAmount) / FIAT_TO_MON_RATE;



// Formularios centralizados para evitar duplicación de código
// Estos formularios se importan tanto en UserDashboard como en GroupDetail

export function DepositForm({ onSubmit, error, isSubmitting }: { onSubmit: (amount: number) => void; error: string; isSubmitting: boolean }) {
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

  return (
    <>
      <h3 className="dash-form-title">Ingresar fondos</h3>
      
      {!showPaymentInfo ? (
        <>
          <p className="hint">Ingrese el monto para generar un código de pago o abonar mediante Mercado Pago.</p>
          <div className="dash-amount-input-wrap">
            <input
              className={`dash-input ${localError || error ? 'dash-input-error' : ''}`}
              type="number"
              placeholder="Monto a ingresar"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          {(localError || error) && <div className="dash-field-error">{localError || error}</div>}
          <button className="btn btn-gold" onClick={handleSubmit} disabled={isSubmitting}>
            Continuar al pago
          </button>
        </>
      ) : (
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p>Tu código de pago en sucursal es:</p>
          <h2 style={{ letterSpacing: "2px", margin: "0" }}>{paymentCode}</h2>
          <p className="hint">O si prefieres, simula el pago digital ahora:</p>
          <button className="btn btn-gold" onClick={handleConfirmPayment} disabled={isSubmitting}>
            {isSubmitting ? "Procesando..." : "Simular pago con Mercado Pago"}
          </button>
        </div>
      )}
    </>
  );
}

export function SpendForm({
  creditLimit,
  error,
  danger,
  isSubmitting,
  onSubmit,
}: {
  creditLimit: number;
  error: string;
  danger?: boolean;
  isSubmitting: boolean;
  onSubmit: (amount: number, desc: string) => void;
}) {
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

  return (
    <>
      <h3 className="dash-form-title">{danger ? "Solicitar transferencia especial" : "Transferir fondos"}</h3>
      <p className="hint">
        {danger
          ? "Esta operación requiere la aprobación por mayoría de los integrantes del grupo."
          : "Transfiera los fondos a una cuenta bancaria indicando el CVU o Alias correspondiente."}
      </p>
      <div className="dash-amount-input-wrap">
        <input
          className={`dash-input ${localError || error ? 'dash-input-error' : ''}`}
          type="number"
          placeholder="Monto"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <input
        className={`dash-input ${localError || error ? 'dash-input-error' : ''}`}
        type="text"
        placeholder="Alias o CVU"
        value={cvu}
        onChange={(e) => setCvu(e.target.value)}
      />
      <input
        className={`dash-input ${localError || error ? 'dash-input-error' : ''}`}
        type="text"
        placeholder="Descripción del retiro"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
      />
      {(localError || error) && <div className="dash-field-error">{localError || error}</div>}
      <button className={`btn ${danger ? "btn-danger" : "btn-gold"}`} onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? "Procesando..." : (danger ? "Enviar solicitud" : "Confirmar transferencia")}
      </button>
    </>
  );
}

export function NewGroupForm({ onSubmit, error, isSubmitting }: { onSubmit: (name: string, creditLimit: string) => void; error: string; isSubmitting: boolean }) {
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

  return (
    <>
      <h3 className="dash-form-title">Crear nuevo fondo común</h3>
      <p className="hint">Una vez creado, podrá compartir el enlace de invitación con los demás integrantes.</p>
      <input
        className={`dash-input ${localError || error ? 'dash-input-error' : ''}`}
        type="text"
        placeholder="Nombre del grupo"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      {(localError || error) && <div className="dash-field-error">{localError || error}</div>}
      <button className="btn btn-gold" onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? "Creando..." : "Crear grupo"}
      </button>
    </>
  );
}

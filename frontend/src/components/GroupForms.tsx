import { useState } from "react";

// Formularios centralizados para evitar duplicación de código
// Estos formularios se importan tanto en UserDashboard como en GroupDetail

export function DepositForm({ onSubmit, error, isSubmitting }: { onSubmit: (amount: number) => void; error: string; isSubmitting: boolean }) {
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

  return (
    <>
      <h3 className="dash-form-title">Ingresar dinero</h3>
      <p className="hint">Transferí desde tu cuenta bancaria o Mercado Pago. Se acredita al instante en el fondo del grupo.</p>
      <input
        className={`dash-input ${localError || error ? 'dash-input-error' : ''}`}
        type="number"
        placeholder="Monto a ingresar"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      {(localError || error) && <div className="dash-field-error">{localError || error}</div>}
      <button className="btn btn-gold" onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? "Procesando..." : "Confirmar ingreso"}
      </button>
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

  return (
    <>
      <h3 className="dash-form-title">{danger ? "Pedir un monto mayor" : "Registrar gasto"}</h3>
      <p className="hint">
        {danger
          ? "Esto le llega como notificación a todo el grupo y necesita mayoría de votos."
          : `Hasta ${creditLimit === Infinity ? "" : "$" + creditLimit} sin aprobación.`}
      </p>
      <input
        className={`dash-input ${localError || error ? 'dash-input-error' : ''}`}
        type="number"
        placeholder="Monto"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <input
        className={`dash-input ${localError || error ? 'dash-input-error' : ''}`}
        type="text"
        placeholder="Descripción"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
      />
      {(localError || error) && <div className="dash-field-error">{localError || error}</div>}
      <button className={`btn ${danger ? "btn-danger" : "btn-gold"}`} onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? "Procesando..." : (danger ? "Enviar solicitud" : "Registrar")}
      </button>
    </>
  );
}

export function NewGroupForm({ onSubmit, error, isSubmitting }: { onSubmit: (name: string, creditLimit: string) => void; error: string; isSubmitting: boolean }) {
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

  return (
    <>
      <h3 className="dash-form-title">Crear nuevo grupo</h3>
      <p className="hint">Después le compartís el link de invitación a quien quieras sumar.</p>
      <input
        className={`dash-input ${localError || error ? 'dash-input-error' : ''}`}
        type="text"
        placeholder="Nombre del grupo"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className={`dash-input ${localError || error ? 'dash-input-error' : ''}`}
        type="number"
        placeholder="Máximo por gasto ($)"
        value={limit}
        onChange={(e) => setLimit(e.target.value)}
      />
      {(localError || error) && <div className="dash-field-error">{localError || error}</div>}
      <button className="btn btn-gold" onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? "Creando..." : "Crear grupo"}
      </button>
    </>
  );
}

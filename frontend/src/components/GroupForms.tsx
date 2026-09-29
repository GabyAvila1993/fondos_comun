import { useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import type { Group } from "../types";
import { api } from "../lib/api";
import toast from "react-hot-toast";
import { signTyped, toWei } from "../lib/eip712";

// Helpers para montos (simulando 1 MON = $1000 ARS)
const FIAT_TO_MON = 1000;
const monToFiat = (mon: number) => mon * FIAT_TO_MON;
const fiatToMon = (fiat: number) => fiat / FIAT_TO_MON;

interface GroupFormsProps {
  type: "new_group" | "deposit" | "spend" | "join_group";
  group?: Group;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function GroupForms({ type, group, onSuccess, onCancel }: GroupFormsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user, getAccessToken } = usePrivy();
  const { wallets } = useWallets();

  const handleCreateGroup = async (name: string, limitFiat: number) => {
    let tid;
    try {
      setLoading(true);
      setError("");
      
      const token = await getAccessToken();
      if (!token) throw new Error("No autenticado");

      tid = toast.loading("Creando grupo...");

      const start = Date.now();
      await api.createGroup(token, {
        name,
        creditLimit: String(fiatToMon(limitFiat)),
        dailyLimit: 0
      });
      const end = Date.now();
      
      toast.success(`¡Grupo creado en ${(end-start)/1000}s! ⚡️`, { id: tid });
      onSuccess();
    } catch (err: any) {
      setError(err.message);
      if (tid) toast.dismiss(tid);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (amountFiat: number) => {
    if (!group) return;
    let tid;
    try {
      setLoading(true);
      setError("");
      
      const token = await getAccessToken();
      if (!token) throw new Error("No autenticado");
      
      tid = toast.loading("Confirmando depósito...");
      const start = Date.now();
      await api.deposit(token, group.id, amountFiat);
      const end = Date.now();
      
      toast.success(`¡Depósito exitoso en ${(end-start)/1000}s! ⚡️`, { id: tid });
      onSuccess();
    } catch (err: any) {
      setError(err.message);
      if (tid) toast.dismiss(tid);
    } finally {
      setLoading(false);
    }
  };

  const handleSpend = async (amountFiat: number, desc: string) => {
    if (!group) return;
    try {
      setLoading(true);
      setError("");
      
      const token = await getAccessToken();
      if (!token) throw new Error("No autenticado");

      const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
      if (!embeddedWallet) throw new Error("Wallet no encontrada");

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
      
      toast.success(`¡Gasto solicitado en ${(end-start)/1000}s! ⚡️`, { id: tid });
      onSuccess();
    } catch (err: any) {
      setError(err.message);
      toast.dismiss();
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!group) return;
    try {
      setLoading(true);
      setError("");
      
      const token = await getAccessToken();
      if (!token) throw new Error("No autenticado");

      const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
      if (!embeddedWallet) throw new Error("Wallet no encontrada");

      const { nonce } = await api.getNonce(token, group.id);
      
      const message = {
        user: user?.wallet?.address,
        nonce: parseInt(nonce, 10)
      };

      const signature = await signTyped(embeddedWallet, "Join", group.contractAddress, message);

      const tid = toast.loading("Procesando transacción...");
      const start = Date.now();
      await api.join(token, group.id, {
        nonce,
        signature
      });
      const end = Date.now();
      
      toast.success(`¡Te uniste en ${(end-start)/1000}s! ⚡️`, { id: tid });
      onSuccess();
    } catch (err: any) {
      setError(err.message);
      toast.dismiss();
    } finally {
      setLoading(false);
    }
  };

  if (type === "new_group") return <NewGroupForm onSubmit={handleCreateGroup} error={error} loading={loading} />;
  if (type === "deposit") return <DepositForm onSubmit={handleDeposit} error={error} loading={loading} />;
  if (type === "join_group") return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <p style={{ marginBottom: "20px" }}>¿Quieres unirte al grupo <strong>{group?.name}</strong>?</p>
      {error && <div className="error-msg">{error}</div>}
      <button 
        className="btn-primary" 
        style={{ width: "100%" }} 
        onClick={handleJoin} 
        disabled={loading}
      >
        {loading ? "Uniendo..." : "Unirme al Grupo"}
      </button>
    </div>
  );
  if (type === "spend") {
    const limit = group ? monToFiat(Number(group.creditLimit)) : 0;
    return <SpendForm limit={limit} onSubmit={handleSpend} error={error} loading={loading} />;
  }
  return null;
}

// ------------------------------------------------------------
// FORMS INTERNOS
// ------------------------------------------------------------

function DepositForm({ onSubmit, error, loading }: { onSubmit: (a: number) => void; error: string; loading: boolean }) {
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState(1);

  return (
    <div>
      {step === 1 ? (
        <>
          <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
            Ingresa el monto para generar un código de pago o abonar mediante transferencia.
          </p>
          <div className="form-group">
            <label className="form-label">Monto a ingresar (ARS)</label>
            <input 
              className="form-input" 
              type="number" 
              placeholder="$0" 
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
            />
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button className="btn-primary" style={{ width: "100%", marginTop: "16px" }} onClick={() => setStep(2)}>
            Generar código de pago
          </button>
        </>
      ) : (
        <div className="text-center">
          <p style={{ color: "var(--text-muted)", marginBottom: "16px" }}>Código para depósito en efectivo (Rapipago/PagoFácil):</p>
          <h2 style={{ fontSize: "2.5rem", letterSpacing: "4px", margin: "0 0 24px" }}>928374</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "24px", fontSize: "0.85rem" }}>
            O si prefieres pago digital, simula tu depósito con Mercado Pago.
          </p>
          
          <button 
            style={{ 
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
            }} 
            onClick={() => {
              window.open("https://www.mercadopago.com.ar", "_blank");
              onSubmit(Number(amount));
            }} 
            disabled={loading}
          >
            {loading ? "Procesando el pago..." : "Pagar con Mercado Pago"}
          </button>

          <button 
            className="btn-primary"
            style={{ width: "100%", marginTop: "8px" }}
            onClick={() => onSubmit(Number(amount))} 
            disabled={loading}
          >
            {loading ? "Cargando..." : "Simular depósito de prueba"}
          </button>
        </div>
      )}
    </div>
  );
}

function SpendForm({ limit, onSubmit, error, loading }: { limit: number; onSubmit: (a: number, d: string) => void; error: string; loading: boolean }) {
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");

  const numAmount = Number(amount);
  const exceeds = numAmount > limit;

  return (
    <div>
      <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
        Límite de gasto directo: <strong>${limit.toLocaleString("es-AR")}</strong>
      </p>

      <div className="form-group">
        <label className="form-label">Monto (ARS)</label>
        <input className="form-input" type="number" placeholder="$0" value={amount} onChange={e => setAmount(e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Descripción</label>
        <input className="form-input" type="text" placeholder="Ej: Pizza viernes" value={desc} onChange={e => setDesc(e.target.value)} />
      </div>

      {exceeds && amount !== "" && (
        <div style={{ background: "var(--danger-light)", color: "var(--danger)", padding: "12px", borderRadius: "12px", fontSize: "0.85rem", marginBottom: "20px" }}>
          Al superar el límite libre de ${limit}, este gasto pasará a <strong>Votación Mayoritaria</strong>.
        </div>
      )}

      {error && <div className="error-msg">{error}</div>}
      
      <button className="btn-primary" style={{ width: "100%", marginTop: "16px" }} onClick={() => onSubmit(numAmount, desc)} disabled={loading}>
        {loading ? "Procesando..." : (exceeds ? "Pedir Aprobación" : "Gastar directamente")}
      </button>
    </div>
  );
}

function NewGroupForm({ onSubmit, error, loading }: { onSubmit: (n: string, l: number) => void; error: string; loading: boolean }) {
  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");

  return (
    <div>
      <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
        Crea un nuevo fondo común e invita a tus amigos o familiares.
      </p>

      <div className="form-group">
        <label className="form-label">Nombre del grupo</label>
        <input className="form-input" type="text" placeholder="Ej: Viaje Bariloche" value={name} onChange={e => setName(e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Límite libre de gasto (ARS)</label>
        <input className="form-input" type="number" placeholder="Ej: 5000" value={limit} onChange={e => setLimit(e.target.value)} />
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
          Cualquier monto superior requerirá aprobación del grupo.
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}
      
      <button className="btn-primary" style={{ width: "100%", marginTop: "16px" }} onClick={() => onSubmit(name, Number(limit))} disabled={loading}>
        {loading ? "Creando..." : "Crear Grupo"}
      </button>
    </div>
  );
}

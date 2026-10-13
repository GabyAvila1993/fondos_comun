import { useTasaDolar } from "../../compartido/hooks/useTasaDolar";
import { useState, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import type { Group } from "../../compartido/tipos";
import { api } from "../../compartido/lib/api";
import toast from "react-hot-toast";
import { signTyped, toWei } from "../../compartido/lib/eip712";
import { fmt } from "../../compartido/lib/utils";

// Helpers para montos (simulando conversin a USDC)

interface GroupFormsProps {
  type: "new_group" | "deposit" | "spend" | "request_approval" | "join_group" | "propose_limit";
  group?: Group;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function GroupForms({ type, group, onSuccess, onCancel }: GroupFormsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user, getAccessToken } = usePrivy();
  const { wallets } = useWallets();

  // Tasa dinámica ARS -> USD (USDC)
  const fiatToMonRate = useTasaDolar(1000);

  
  const monToFiat = (mon: number) => mon * fiatToMonRate;
  const fiatToMon = (fiat: number) => Number((fiat / fiatToMonRate).toFixed(6));

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
        creditLimitFiat: limitFiat,
        dailyLimit: 100
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

  const getFiatBalance = (g?: Group) => {
    if (!g) return 0;
    if (g.deposits === undefined && g.balance !== undefined) {
      return Number(g.balance) * fiatToMonRate;
    }
    const totalDeposits = (g.deposits || []).reduce((acc: number, d: any) => acc + Number(d.amount), 0);
    const totalExpenses = (g.transactions || []).filter((t: any) => t.executed).reduce((acc: number, t: any) => {
      const match = (t.desc || "").match(/\|ARS:(\d+(?:\.\d+)?)$/);
      return acc + (match ? Number(match[1]) : Number(t.amount) * fiatToMonRate);
    }, 0);
    return Math.max(0, totalDeposits - totalExpenses);
  };

  const handleSpend = async (amountFiat: number, desc: string, forceApprovalOverride = false) => {
    if (!group) return;
    try {
      setLoading(true);
      setError("");
      
      const token = await getAccessToken();
      if (!token) throw new Error("No autenticado");

      const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
      if (!embeddedWallet) throw new Error("Wallet no encontrada");

      const { nonce } = await api.getNonce(token, group.id);
      
      let rate = 0.001;
      try {
        const resp = await fetch("https://dolarapi.com/v1/dolares/cripto");
        if (resp.ok) {
          const data = await resp.json();
          if (data.venta) rate = 1 / data.venta;
        }
      } catch (e) {
        console.warn("Error fetching exchange rate, using fallback");
      }

      const amountMon = String((amountFiat * rate).toFixed(6));
      const effectiveLimitFiat = (group.creditLimitFiat !== undefined && group.creditLimitFiat !== null)
        ? Number(group.creditLimitFiat)
        : (Number(group.creditLimit) / rate);
      const forceApproval = forceApprovalOverride || amountFiat > effectiveLimitFiat;
      const finalDesc = `${desc}|ARS:${amountFiat}`;
      
      const message = {
        user: user?.wallet?.address,
        amount: toWei(amountMon), // Convert to wei for contract
        desc: finalDesc,
        forceApproval,
        nonce: parseInt(nonce, 10)
      };

      const signature = await signTyped(embeddedWallet, "RequestExpense", group.contractAddress, message);

      const tid = toast.loading("Procesando transacción...");
      const start = Date.now();
      await api.requestExpense(token, group.id, {
        amountMon,
        desc: finalDesc,
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

  const handleProposeLimit = async (newLimitFiat: number) => {
    if (!group) return;
    let tid;
    try {
      setLoading(true);
      setError("");
      
      const token = await getAccessToken();
      if (!token) throw new Error("No autenticado");

      const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
      if (!embeddedWallet) throw new Error("Wallet no encontrada");

      const { nonce } = await api.getNonce(token, group.id);
      
      const amountMon = fiatToMon(newLimitFiat).toFixed(6);
      
      const message = {
        proposer: user?.wallet?.address,
        newLimit: toWei(amountMon),
        nonce: Number(nonce)
      };

      const signature = await signTyped(embeddedWallet, "ProposeLimit", group.contractAddress, message);

      tid = toast.loading("Procesando propuesta de límite...");
      const start = Date.now();
      await api.proposeLimitChange(token, group.id, {
        newLimit: message.newLimit,
        nonce,
        signature
      });
      const end = Date.now();
      
      toast.success(`¡Propuesta creada en ${(end-start)/1000}s! ⚡️`, { id: tid });
      onSuccess();
    } catch (err: any) {
      setError(err.message);
      if (tid) toast.dismiss(tid);
    } finally {
      setLoading(false);
    }
  };

  if (type === "new_group") return <NewGroupForm onSubmit={handleCreateGroup} error={error} loading={loading} />;
  if (type === "deposit") return <DepositForm onSubmit={handleDeposit} error={error} loading={loading} />;
  if (type === "join_group") return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <p style={{ marginBottom: "20px" }}>¿Quieres unirte al grupo <strong>{group ? (group.editedName || group.name) : ""}</strong>?</p>
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
  if (type === "spend" || type === "request_approval") {
    const limit = group
      ? (group.creditLimitFiat !== undefined && group.creditLimitFiat !== null
          ? Number(group.creditLimitFiat)
          : Math.round(monToFiat(Number(group.creditLimit))))
      : 0;
    const availableBalance = Math.round(getFiatBalance(group));
    return (
      <SpendForm
        limit={limit}
        availableBalance={availableBalance}
        forceApprovalMode={type === "request_approval"}
        onSubmit={(amt, desc) => handleSpend(amt, desc, type === "request_approval")}
        error={error}
        loading={loading}
      />
    );
  }
  if (type === "propose_limit") {
    return <ProposeLimitForm onSubmit={handleProposeLimit} error={error} loading={loading} />;
  }
  return null;
}

// ------------------------------------------------------------
// FORMS INTERNOS
// ------------------------------------------------------------

function DepositForm({ onSubmit, error, loading }: { onSubmit: (a: number) => void; error: string; loading: boolean }) {
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState(1);
  const numAmount = Number(amount);

  return (
    <div>
      {step === 1 ? (
        <>
          <p style={{ color: "var(--text-muted)", marginBottom: "20px" }}>
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
          <button 
            className="btn-primary" 
            style={{ width: "100%", marginTop: "16px" }} 
            onClick={() => setStep(2)}
            disabled={!numAmount || numAmount <= 0}
          >
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

function SpendForm({ 
  limit, 
  availableBalance, 
  forceApprovalMode = false, 
  onSubmit, 
  error, 
  loading 
}: { 
  limit: number; 
  availableBalance: number; 
  forceApprovalMode?: boolean; 
  onSubmit: (a: number, d: string) => void; 
  error: string; 
  loading: boolean 
}) {
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");

  const numAmount = Number(amount);
  const exceedsBalance = numAmount > availableBalance;
  const exceedsLimit = numAmount > limit || forceApprovalMode;

  return (
    <div>
      <div style={{ background: "var(--bg-2)", borderRadius: "12px", padding: "12px 16px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Fondo Disponible</div>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--primary)" }}>{fmt(availableBalance)}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Límite Libre</div>
          <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>{fmt(limit)}</div>
        </div>
      </div>

      {forceApprovalMode && (
        <div style={{ background: "rgba(102, 87, 246, 0.08)", border: "1px solid rgba(102, 87, 246, 0.2)", borderRadius: "12px", padding: "12px", fontSize: "0.85rem", marginBottom: "16px" }}>
          🗳️ <strong>Modo Aprobación de Gasto:</strong> Este pedido requerirá votación mayoritaria de los integrantes del grupo antes de ejecutarse.
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Monto (ARS)</label>
        <input 
          className="form-input" 
          type="number" 
          placeholder="$0" 
          value={amount} 
          onChange={e => setAmount(e.target.value)} 
        />
      </div>

      <div className="form-group">
        <label className="form-label">Descripción</label>
        <input className="form-input" type="text" placeholder="Ej: Pizza viernes / Reserva de cancha" value={desc} onChange={e => setDesc(e.target.value)} />
      </div>

      {exceedsBalance && numAmount > 0 && (
        <div style={{ background: "var(--danger-light)", color: "var(--danger)", padding: "12px", borderRadius: "12px", fontSize: "0.85rem", marginBottom: "20px", fontWeight: 500 }}>
          ⚠️ Saldo insuficiente: El monto ingresado ({fmt(numAmount)}) supera el fondo disponible ({fmt(availableBalance)}).
        </div>
      )}

      {!exceedsBalance && exceedsLimit && numAmount > 0 && !forceApprovalMode && (
        <div style={{ background: "var(--warning-light, rgba(245, 158, 11, 0.1))", color: "var(--warning, #d97706)", padding: "12px", borderRadius: "12px", fontSize: "0.85rem", marginBottom: "20px" }}>
          Al superar el límite libre de {fmt(limit)}, este gasto pasará a <strong>Votación Mayoritaria</strong> del grupo.
        </div>
      )}

      {error && <div className="error-msg">{error}</div>}
      
      <button 
        className="btn-primary" 
        style={{ 
          width: "100%", 
          marginTop: "16px",
          opacity: exceedsBalance || !numAmount || numAmount <= 0 ? 0.6 : 1,
          cursor: exceedsBalance || !numAmount || numAmount <= 0 ? "not-allowed" : "pointer"
        }} 
        onClick={() => onSubmit(numAmount, desc)} 
        disabled={loading || exceedsBalance || !numAmount || numAmount <= 0 || !desc.trim()}
      >
        {loading 
          ? "Procesando..." 
          : exceedsBalance 
            ? "Saldo insuficiente en el fondo" 
            : (exceedsLimit 
                ? "Pedir Aprobación de Gasto" 
                : `Gastar directamente (${fmt(numAmount)})`
              )
        }
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

function ProposeLimitForm({ onSubmit, error, loading }: { onSubmit: (a: number) => void; error: string; loading: boolean }) {
  const [amount, setAmount] = useState("");
  
  return (
    <div>
      <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
        Propón un nuevo límite general para el grupo. Si hay otros miembros, deberán votar para aprobarlo.
      </p>
      
      <div className="form-group">
        <label className="form-label">Nuevo Límite de Gasto (ARS)</label>
        <input 
          className="form-input" 
          type="number" 
          placeholder="Ej: 50000" 
          value={amount} 
          onChange={e => setAmount(e.target.value)} 
        />
      </div>

      {error && <div className="error-msg">{error}</div>}
      <button className="btn-primary" style={{ width: "100%", marginTop: "16px" }} onClick={() => onSubmit(Number(amount))} disabled={loading}>
        {loading ? "Proponiendo..." : "Proponer Límite"}
      </button>
    </div>
  );
}


import type { Group } from "../../types";
import { Check, X, HandCoins } from "@phosphor-icons/react";

interface AprobacionesTabProps {
  group: Group | undefined;
  userAddress: string;
  onApprove: (txId: number) => void;
  onReject: (txId: number) => void;
  onApproveLimit: (proposalId: number) => void;
  onRejectLimit: (proposalId: number) => void;
}

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

export default function AprobacionesTab({ group, userAddress, onApprove, onReject }: AprobacionesTabProps) {
  if (!group) return <div className="text-center text-muted" style={{ padding: "40px 20px" }}>Selecciona un grupo para ver sus aprobaciones pendientes.</div>;

  const pendingTxs = group.pending || [];
  const pendingLimits = group.pendingLimitProposals || [];
  const limit = Number(group.creditLimit);
  const totalMembers = group.members?.length || 1;
  const requiredVotes = Math.floor(totalMembers / 2) + 1;

  return (
    <div>
      <div className="header-green" style={{ paddingBottom: "24px", borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
        <div className="header-top" style={{ marginBottom: 0 }}>
          <span className="header-title">Aprobaciones de Votaciones</span>
        </div>
      </div>
      
      <div style={{ background: "var(--bg-color)", padding: "16px 20px" }}>
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "16px" }}>
          Solicitudes pendientes en {group.name}
        </div>

        {pendingLimits.map((tx, idx) => {
          const newLimit = Number(tx.newLimit);
          const votesCount = tx.votesFor;
          const percent = Math.min((votesCount / requiredVotes) * 100, 100);

          return (
            <div className="approval-card" key={`limit-${idx}`}>
              <div className="approval-header">
                <div className="approval-user-info">
                  <div className="tx-avatar" style={{ background: "var(--primary)", color: "white" }}>
                    {tx.proposer.substring(2,4).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>Miembro {tx.proposer.substring(0, 6)}...</div>
                    <div className="approval-time">Creador del grupo</div>
                  </div>
                </div>
                <div className="approval-role" style={{ background: "#f0fdf4", color: "#166534" }}>NUEVO LÍMITE</div>
              </div>

              <div className="approval-content">
                <div className="approval-title">Propuesta de cambio de límite de retiro</div>
                
                <div className="approval-amounts">
                  <div>
                    <div className="approval-amount-label">Monto Propuesto</div>
                    <div className="approval-amount-value" style={{ color: "var(--primary)" }}>{fmt(newLimit * 1000)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="approval-amount-label">Límite Actual</div>
                    <div className="approval-amount-value">{fmt(limit * 1000)}</div>
                  </div>
                </div>

                <div className="approval-progress">
                  <div className="progress-info">
                    <span>{votesCount} de {requiredVotes} aprobaciones necesarias</span>
                    <span style={{ fontWeight: 600 }}>{Math.round(percent)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="approval-actions">
                <button 
                  className="approval-btn reject" 
                  onClick={() => onRejectLimit(tx.id)}
                >
                  <X weight="bold" size={18} /> Rechazar
                </button>
                <button 
                  className="approval-btn approve"
                  onClick={() => onApproveLimit(tx.id)}
                >
                  <Check weight="bold" size={18} /> Aprobar
                </button>
              </div>
            </div>
          );
        })}

        {pendingTxs.map((tx, idx) => {
          const amount = Number(tx.amount);
          const exceed = amount > limit;
          const votesCount = tx.votesFor;
          const percent = Math.min((votesCount / requiredVotes) * 100, 100);

          return (
            <div className="approval-card" key={idx}>
              <div className="approval-header">
                <div className="approval-user-info">
                  <div className="tx-avatar" style={{ background: "var(--primary)", color: "white" }}>
                    {tx.proposer.substring(2,4).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>Miembro {tx.proposer.substring(0, 6)}...</div>
                    <div className="approval-time">Hace 2 horas (demo)</div>
                  </div>
                </div>
                <div className="approval-role">PROPIETARIO</div>
              </div>

              <div className="approval-content">
                <div className="approval-title">{tx.desc || "Solicitud de gasto sin descripción"}</div>
                
                <div className="approval-amounts">
                  <div>
                    <div className="approval-amount-label">Monto Solicitado</div>
                    <div className="approval-amount-value">{fmt(amount * 1000)}</div>
                  </div>
                  {exceed && (
                    <div style={{ textAlign: "right" }}>
                      <div className="approval-amount-label">Excedente Libre</div>
                      <div className="approval-amount-exceed">
                        {fmt((amount - limit) * 1000)} <HandCoins weight="fill" size={16} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="approval-progress">
                  <div className="progress-header">
                    <span>Votos Recibidos</span>
                    <span>{votesCount} / {requiredVotes}</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${percent}%` }}></div>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "8px" }}>
                    {exceed ? "Al superar el límite libre, necesita votación mayoritaria para ser aprobado." : "Votación regular."}
                  </div>
                </div>
              </div>

              <div className="approval-actions">
                <button className="btn-outline" style={{ display: "flex", gap: "8px", justifyContent: "center", color: "var(--danger)", borderColor: "var(--danger)" }} onClick={() => onReject(tx.id)}>
                  <X weight="bold" /> Rechazar
                </button>
                <button className="btn-primary" style={{ display: "flex", gap: "8px", justifyContent: "center" }} onClick={() => onApprove(tx.id)}>
                  <Check weight="bold" /> Aprobar
                </button>
              </div>
            </div>
          );
        })}

        {pendingTxs.length === 0 && pendingLimits.length === 0 && (
          <div className="text-center text-muted" style={{ padding: "40px 0" }}>No hay solicitudes pendientes en este momento.</div>
        )}
      </div>
    </div>
  );
}

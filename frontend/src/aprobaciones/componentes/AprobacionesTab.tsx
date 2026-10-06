import { useState, useEffect } from "react";
import type { Group } from "../../compartido/tipos";
import { Check, X, HandCoins } from "@phosphor-icons/react";
import { fmt } from "../../compartido/lib/utils";

interface AprobacionesTabProps {
  groups: Group[];
  userAddress: string;
  userId: string;
  onApprove: (groupId: string, txId: number) => void;
  onReject: (groupId: string, txId: number) => void;
  onApproveLimit: (groupId: string, proposalId: number) => void;
  onRejectLimit: (groupId: string, proposalId: number) => void;
  onApproveDelete: (groupId: string, proposalId: string) => void;
  onRejectDelete: (groupId: string, proposalId: string) => void;
  readVotes: string[];
}

export default function AprobacionesTab({ groups, userAddress, userId, onApprove, onReject, onApproveLimit, onRejectLimit, onApproveDelete, onRejectDelete, readVotes }: AprobacionesTabProps) {
  const [rate, setRate] = useState(1000);

  useEffect(() => {
    fetch("https://dolarapi.com/v1/dolares/cripto")
      .then(res => res.json())
      .then(data => {
        if (data.venta) setRate(data.venta);
      })
      .catch(console.error);
  }, []);

  if (!groups || groups.length === 0) return <div className="text-center text-muted" style={{ padding: "40px 20px" }}>No perteneces a ningún grupo aún.</div>;

  const getGroupName = (g: Group) => g.editedName || g.name;

  const allPendingDeletes: any[] = [];
  const allPendingLimits: any[] = [];
  const allPendingTxs: any[] = [];

  for (const g of groups) {
    const limit = Number(g.creditLimit);
    const totalMembers = g.members?.length || 1;
    const requiredVotes = Math.floor(totalMembers / 2) + 1;
    const deleteRequiredVotes = Math.floor((totalMembers - 1) / 2) + 1;
    const groupName = getGroupName(g);
    
    const myWallet = (g.usersMap?.[userId]?.walletAddress || userAddress || "").toLowerCase();

    const pendingDel = (g.deleteProposals || []).filter(p => p.status === "pending" && !readVotes.includes(`del-${p.id}`) && p.creatorUserId !== userId).map(p => ({...p, groupId: g.id, groupName, deleteRequiredVotes}));
    const pendingLim = (g.pendingLimitProposals || []).filter(p => !readVotes.includes(`lim-${p.id}`) && p.proposer?.toLowerCase() !== myWallet).map(p => ({...p, groupId: g.id, groupName, requiredVotes, limit, usersMap: g.usersMap}));
    const pendingTx = (g.pending || []).filter(p => !readVotes.includes(`tx-${p.id}`) && p.proposer?.toLowerCase() !== myWallet).map(p => ({...p, groupId: g.id, groupName, requiredVotes, limit, usersMap: g.usersMap}));

    allPendingDeletes.push(...pendingDel);
    allPendingLimits.push(...pendingLim);
    allPendingTxs.push(...pendingTx);
  }

  return (
    <div>
      <div className="header-green" style={{ paddingBottom: "24px", borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
        <div className="header-top" style={{ marginBottom: 0 }}>
          <span className="header-title">Aprobaciones de Votaciones</span>
        </div>
      </div>
      
      <div style={{ background: "var(--bg-color)", padding: "16px 20px" }}>
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "16px" }}>
          Solicitudes pendientes de todos tus grupos
        </div>

        {allPendingDeletes.map((proposal, idx) => {
          let votesFor = 0;
          for (const v of proposal.votes) {
            if (v.approve) votesFor++;
          }
          const percent = Math.min((votesFor / proposal.deleteRequiredVotes) * 100, 100);

          return (
            <div className="approval-card" key={`delete-${idx}`}>
              <div className="approval-header">
                <div className="approval-user-info">
                  <div className="tx-avatar" style={{ background: "var(--danger)", color: "white" }}>
                    {proposal.creatorUserId.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>El administrador solicitó</div>
                    <div className="approval-time">Eliminar el grupo <b>{proposal.groupName}</b></div>
                  </div>
                </div>
                <div className="approval-role" style={{ background: "#fef2f2", color: "#991b1b" }}>PELIGRO</div>
              </div>

              <div className="approval-content">
                <div className="approval-title">Si se aprueba, el grupo será borrado para todos y los saldos on-chain quedarán huérfanos.</div>
                
                <div className="approval-progress">
                  <div className="progress-info">
                    <span>{votesFor} de {proposal.deleteRequiredVotes} aprobaciones necesarias</span>
                    <span style={{ fontWeight: 600 }}>{Math.round(percent)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${percent}%`, background: "var(--danger)" }}></div>
                  </div>
                </div>
              </div>

              <div className="approval-actions">
                <button 
                  className="approval-btn reject" 
                  onClick={() => onRejectDelete(proposal.groupId, proposal.id)}
                >
                  <X weight="bold" size={18} /> Rechazar
                </button>
                <button 
                  className="approval-btn approve"
                  style={{ background: "var(--danger)", color: "white" }}
                  onClick={() => onApproveDelete(proposal.groupId, proposal.id)}
                >
                  <Check weight="bold" size={18} /> Aprobar Eliminación
                </button>
              </div>
            </div>
          );
        })}

        {allPendingLimits.map((tx, idx) => {
          const newLimit = Number(tx.newLimit);
          const votesCount = tx.votesFor;
          const percent = Math.min((votesCount / tx.requiredVotes) * 100, 100);

          return (
            <div className="approval-card" key={`limit-${idx}`}>
              <div className="approval-header">
                <div className="approval-user-info">
                  <div className="tx-avatar" style={{ background: "var(--primary)", color: "white" }}>
                    {tx.proposer.substring(2,4).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{tx.usersMap?.[tx.proposer.toLowerCase()]?.name || (tx.usersMap?.[tx.proposer.toLowerCase()]?.email ? tx.usersMap?.[tx.proposer.toLowerCase()]?.email.split('@')[0] : `Miembro ${tx.proposer.substring(0, 6)}...`)}</div>
                    <div className="approval-time">Grupo: <b>{tx.groupName}</b></div>
                  </div>
                </div>
                <div className="approval-role" style={{ background: "#f0fdf4", color: "#166534" }}>NUEVO LÍMITE</div>
              </div>

              <div className="approval-content">
                <div className="approval-title">Propuesta de cambio de límite de retiro</div>
                
                <div className="approval-amounts">
                  <div>
                    <div className="approval-amount-label">Monto Propuesto</div>
                    <div className="approval-amount-value" style={{ color: "var(--primary)" }}>{fmt(newLimit * rate)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="approval-amount-label">Límite Actual</div>
                    <div className="approval-amount-value">{fmt(tx.limit * rate)}</div>
                  </div>
                </div>

                <div className="approval-progress">
                  <div className="progress-info">
                    <span>{votesCount} de {tx.requiredVotes} aprobaciones necesarias</span>
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
                  onClick={() => onRejectLimit(tx.groupId, tx.id)}
                >
                  <X weight="bold" size={18} /> Rechazar
                </button>
                <button 
                  className="approval-btn approve"
                  onClick={() => onApproveLimit(tx.groupId, tx.id)}
                >
                  <Check weight="bold" size={18} /> Aprobar
                </button>
              </div>
            </div>
          );
        })}

        {allPendingTxs.map((tx, idx) => {
          const amount = Number(tx.amount);
          const exceed = amount > tx.limit;
          const votesCount = tx.votesFor;
          const percent = Math.min((votesCount / tx.requiredVotes) * 100, 100);

          return (
            <div className="approval-card" key={idx}>
              <div className="approval-header">
                <div className="approval-user-info">
                  <div className="tx-avatar" style={{ background: "var(--primary)", color: "white" }}>
                    {tx.proposer.substring(2,4).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{tx.usersMap?.[tx.proposer.toLowerCase()]?.name || (tx.usersMap?.[tx.proposer.toLowerCase()]?.email ? tx.usersMap?.[tx.proposer.toLowerCase()]?.email.split('@')[0] : `Miembro ${tx.proposer.substring(0, 6)}...`)}</div>
                    <div className="approval-time">{new Date(tx.createdAt).toLocaleDateString()} - <b>{tx.groupName}</b></div>
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
                        {fmt((amount - tx.limit) * 1000)} <HandCoins weight="fill" size={16} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="approval-progress">
                  <div className="progress-header">
                    <span>Votos Recibidos</span>
                    <span>{votesCount} / {tx.requiredVotes}</span>
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
                <button className="btn-outline" style={{ display: "flex", gap: "8px", justifyContent: "center", color: "var(--danger)", borderColor: "var(--danger)" }} onClick={() => onReject(tx.groupId, tx.id)}>
                  <X weight="bold" /> Rechazar
                </button>
                <button className="btn-primary" style={{ display: "flex", gap: "8px", justifyContent: "center" }} onClick={() => onApprove(tx.groupId, tx.id)}>
                  <Check weight="bold" /> Aprobar
                </button>
              </div>
            </div>
          );
        })}

        {allPendingTxs.length === 0 && allPendingLimits.length === 0 && allPendingDeletes.length === 0 && (
          <div className="text-center text-muted" style={{ padding: "40px 0" }}>No hay solicitudes pendientes en ninguno de tus grupos en este momento.</div>
        )}
      </div>
    </div>
  );
}

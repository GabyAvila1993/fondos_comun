import type { Tx } from "../types";

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");
const short = (addr: string) => addr.slice(0, 6) + "..." + addr.slice(-4);

export default function PendingApprovals({
  pending,
  majorityNeeded,
  onVote,
}: {
  pending: Tx[];
  majorityNeeded: number;
  onVote: (txId: number, approve: boolean) => void;
}) {
  if (!pending.length) return null;
  return (
    <div id="pendingSection">
      <div className="section-title">Esperando aprobación</div>
      {pending.map((p) => (
        <div className="approval-card" key={p.id}>
          <div className="approval-top">
            <span>
              <b>{short(p.proposer)}</b> pide {fmt(Number(p.amount))}
            </span>
            <span>{p.votesFor}/{majorityNeeded}</span>
          </div>
          <div className="approval-desc">{p.desc}</div>
          <div className="vote-row">
            <div className="vote-btn" onClick={() => onVote(p.id, true)}>Aprobar</div>
            <div className="vote-btn" onClick={() => onVote(p.id, false)}>Rechazar</div>
          </div>
        </div>
      ))}
    </div>
  );
}

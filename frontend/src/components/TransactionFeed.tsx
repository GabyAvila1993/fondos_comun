import type { Tx } from "../types";

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");
const short = (addr: string) => addr.slice(0, 6) + "..." + addr.slice(-4);

export default function TransactionFeed({ transactions }: { transactions: Tx[] }) {
  if (!transactions.length) return <div className="empty-state">Todavía no hay movimientos.</div>;
  return (
    <div className="list-card">
      {transactions.map((t) => (
        <div className="row-item" key={t.id}>
          <div className={`row-icon ${t.rejected ? "pending" : "spend"}`}>{t.executed ? "🛍️" : "⏳"}</div>
          <div className="row-body">
            <div className="row-title">{t.desc}</div>
            <div className="row-sub">
              {short(t.proposer)} · {new Date(t.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
          <div className="row-amount neg">-{fmt(Number(t.amount))}</div>
        </div>
      ))}
    </div>
  );
}

import type { Tx } from "../types";

const MON_TO_FIAT_RATE = 0.001;
const fmtFiat = (monAmount: number) => {
  const fiatAmount = Number(monAmount) / MON_TO_FIAT_RATE;
  return "$" + Math.round(fiatAmount).toLocaleString("es-AR");
};
const short = (addr: string) => addr.slice(0, 6) + "..." + addr.slice(-4);

export default function TransactionFeed({ transactions }: { transactions: Tx[] }) {
  if (!transactions.length) return <div className="empty-state">No hay movimientos recientes.</div>;
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
          <div className="row-amount neg">-{fmtFiat(Number(t.amount))}</div>
        </div>
      ))}
    </div>
  );
}

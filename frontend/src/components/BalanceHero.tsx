import type { Group } from "../types";

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

export default function BalanceHero({
  groups,
  activeId,
  onSelect,
}: {
  groups: Group[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const active = groups.find((g) => g.id === activeId);
  const balance = active ? Number(active.balance || 0) : 0;

  return (
    <div className="hero">
      <div className="label">FONDO DISPONIBLE</div>
      <div className="amount">{fmt(balance)}</div>
      <div className="group-tabs">
        {groups.map((g) => (
          <div key={g.id} className={`group-tab ${g.id === activeId ? "active" : ""}`} onClick={() => onSelect(g.id)}>
            {g.name}
          </div>
        ))}
      </div>
    </div>
  );
}

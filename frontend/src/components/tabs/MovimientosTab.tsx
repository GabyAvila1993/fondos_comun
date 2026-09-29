import { useState, useMemo, useEffect } from "react";
import type { Group, Tx, Deposit } from "../../types";

interface MovimientosTabProps {
  groups: Group[];
  initialGroupId?: string;
}

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");
type FilterType = "all" | "in" | "out";

export default function MovimientosTab({ groups, initialGroupId }: MovimientosTabProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(initialGroupId || null);

  useEffect(() => {
    setSelectedGroupId(initialGroupId || null);
  }, [initialGroupId]);

  // Normalizar los movimientos de cada grupo
  const allMovements = useMemo(() => {
    const list: any[] = [];
    for (const g of groups) {
      const deposits = (g.deposits || []).map(dep => {
        const dateStr = String(dep.createdAt);
        const parsedTime = new Date(dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z').getTime();

        return {
          type: "in" as const,
          id: `dep-${dep.id}`,
          groupId: g.id,
          groupName: g.name,
          user: "Miembro",
          avatar: "IN",
          desc: "Ingreso de dinero",
          amount: dep.amount,
          timestamp: isNaN(parsedTime) ? Date.now() : parsedTime
        };
      });

      // Calcular la fecha base para los gastos: el máximo entre Date.now() y el depósito más reciente.
      // Esto soluciona la desincronización si la DB tiene el reloj más adelantado.
      const maxDepositTime = deposits.reduce((max, d) => Math.max(max, d.timestamp), 0);
      const baseTime = Math.max(Date.now(), maxDepositTime);

      const expenses = (g.transactions || []).map((tx, idx) => ({
        type: "out" as const,
        id: `tx-${tx.id}`,
        groupId: g.id,
        groupName: g.name,
        user: tx.proposer?.substring(0, 6) || "Unknown",
        avatar: tx.proposer?.substring(2, 4).toUpperCase() || "U",
        desc: tx.desc || "Gasto general",
        amount: Number(tx.amount) * 1000,
        // Usamos baseTime para intercalar los gastos con los depósitos correctamente
        timestamp: baseTime - ((g.transactions?.length || 0) - idx) * 60000 
      }));
      list.push(...expenses, ...deposits);
    }
    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [groups]);

  // Si hay un grupo seleccionado, mostramos la vista detallada
  if (selectedGroupId) {
    const group = groups.find(g => g.id === selectedGroupId);
    if (!group) return null;

    const groupMovements = allMovements.filter(m => m.groupId === selectedGroupId && (filter === "all" || m.type === filter));

    const btnStyle = (active: boolean) => ({
      background: active ? "var(--primary)" : "var(--bg-2)",
      color: active ? "white" : "var(--text-muted)",
      padding: "6px 16px",
      borderRadius: "100px",
      fontSize: "0.85rem",
      fontWeight: 500,
      border: "none",
      cursor: "pointer"
    });

    return (
      <div>
        <div className="header-green" style={{ paddingBottom: "24px", borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
          <div className="header-top" style={{ marginBottom: 0 }}>
            <span 
              style={{ cursor: "pointer", marginRight: "10px", fontSize: "1.2rem" }} 
              onClick={() => setSelectedGroupId(null)}
            >
              ←
            </span>
            <span className="header-title">Movimientos en {group.name}</span>
          </div>
        </div>
        
        <div style={{ background: "var(--card-bg)", padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", gap: "8px", overflowX: "auto" }}>
          <button style={btnStyle(filter === "all")} onClick={() => setFilter("all")}>Todos</button>
          <button style={btnStyle(filter === "in")} onClick={() => setFilter("in")}>Ingresos</button>
          <button style={btnStyle(filter === "out")} onClick={() => setFilter("out")}>Gastos</button>
        </div>

        <div className="card" style={{ padding: "0", margin: "0", borderRadius: 0, border: "none", boxShadow: "none" }}>
          <div className="tx-list" style={{ padding: "0 20px 20px" }}>
            {groupMovements.map((item) => (
              <div className="tx-item" key={item.id}>
                <div className="tx-avatar" style={{ background: item.type === "in" ? "var(--primary-light)" : "var(--bg-2)", color: item.type === "in" ? "white" : "inherit" }}>
                  {item.avatar}
                </div>
                <div className="tx-details">
                  <div className="tx-user">{item.type === "in" ? item.user : `Miembro ${item.user}...`}</div>
                  <div className="tx-desc">{item.desc}</div>
                </div>
                <div>
                  <div className={`tx-amount ${item.type === "out" ? "negative" : "positive"}`} style={{ color: item.type === "in" ? "var(--primary)" : "inherit" }}>
                    {item.type === "out" ? "- " : "+ "}{fmt(item.amount)}
                  </div>
                  <div className="tx-date">{item.type === "in" ? "Completado" : "Aprobado"}</div>
                </div>
              </div>
            ))}
            {groupMovements.length === 0 && (
              <div className="text-center text-muted" style={{ padding: "40px 0" }}>No hay movimientos en este grupo.</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Si no hay grupo seleccionado, mostramos la vista global agrupada
  return (
    <div>
      <div className="header-green" style={{ paddingBottom: "24px", borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
        <div className="header-top" style={{ marginBottom: 0 }}>
          <span className="header-title">Últimos Movimientos</span>
        </div>
      </div>

      <div style={{ padding: "20px" }}>
        {groups.map(g => {
          const m = allMovements.filter(x => x.groupId === g.id).slice(0, 3);
          if (m.length === 0) return null;
          
          return (
            <div key={g.id} style={{ marginBottom: "30px" }}>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "12px", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
                {g.name}
              </h3>
              <div className="tx-list">
                {m.map(item => (
                  <div className="tx-item" key={item.id} style={{ padding: "8px 0" }}>
                    <div className="tx-avatar" style={{ background: item.type === "in" ? "var(--primary-light)" : "var(--bg-2)", color: item.type === "in" ? "white" : "inherit" }}>
                      {item.avatar}
                    </div>
                    <div className="tx-details">
                      <div className="tx-user">{item.type === "in" ? item.user : `Miembro ${item.user}...`}</div>
                      <div className="tx-desc">{item.desc}</div>
                    </div>
                    <div>
                      <div className={`tx-amount ${item.type === "out" ? "negative" : "positive"}`} style={{ color: item.type === "in" ? "var(--primary)" : "inherit" }}>
                        {item.type === "out" ? "- " : "+ "}{fmt(item.amount)}
                      </div>
                      <div className="tx-date">{item.type === "in" ? "Completado" : "Aprobado"}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setSelectedGroupId(g.id)}
                style={{ 
                  background: "transparent", 
                  color: "var(--primary)", 
                  border: "1px solid var(--primary)", 
                  borderRadius: "8px", 
                  padding: "8px", 
                  width: "100%", 
                  marginTop: "12px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Ver Más
              </button>
            </div>
          );
        })}
        {allMovements.length === 0 && (
          <div className="text-center text-muted" style={{ padding: "40px 0" }}>Aún no hay movimientos.</div>
        )}
      </div>
    </div>
  );
}


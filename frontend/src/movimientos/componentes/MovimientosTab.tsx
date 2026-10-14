import { useState, useMemo, useEffect } from "react";
import type { Group, Tx, Deposit } from "../../compartido/tipos";
import { fmt } from "../../compartido/lib/utils";

interface MovimientosTabProps {
  groups: Group[];
  initialGroupId?: string;
}

type FilterType = "all" | "in" | "out";

export default function MovimientosTab({ groups, initialGroupId }: MovimientosTabProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(initialGroupId || null);
  
  const getGroupName = (g: Group) => g.editedName || g.name;

  useEffect(() => {
    setSelectedGroupId(initialGroupId || null);
  }, [initialGroupId]);

  // Normalizar los movimientos de cada grupo
  const allMovements = useMemo(() => {
    const list: any[] = [];
    for (const g of groups) {
      const usersMap = (g as any).usersMap || {};
      const deposits = (g.deposits || []).map(dep => {
        const dateStr = String(dep.createdAt);
        const parsedTime = new Date(dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z').getTime();

        const u = usersMap[dep.userId];
        const uName = u ? (u.name || (u.email ? u.email.split('@')[0] : "Miembro")) : "Miembro";

        return {
          type: "in" as const,
          id: `dep-${dep.id}`,
          groupId: g.id,
          groupName: getGroupName(g),
          contractAddress: g.contractAddress,
          user: uName,
          avatar: uName.substring(0,2).toUpperCase(),
          desc: "Ingreso de dinero",
          amount: dep.amount,
          timestamp: isNaN(parsedTime) ? Date.now() : parsedTime,
          status: "Completado"
        };
      });

      // Calcular la fecha base para los gastos: el máximo entre Date.now() y el depósito más reciente.
      // Aseguramos que los retiros queden por encima de los depósitos previos y en orden cronológico inverso.
      const maxDepositTime = deposits.reduce((max, d) => Math.max(max, d.timestamp), 0);
      const totalTxs = g.transactions?.length || 0;
      const baseTime = Math.max(Date.now(), maxDepositTime) + (totalTxs + 1) * 60000;

      const expenses = (g.transactions || []).map((tx, idx) => {
        const u = usersMap[tx.proposer.toLowerCase()];
        const defaultName = tx.proposer?.substring(0, 6) || "Unknown";
        const uName = u ? (u.name || (u.email ? u.email.split('@')[0] : defaultName)) : defaultName;

        const match = tx.desc.match(/\|ARS:(\d+(?:\.\d+)?)$/);
        const fiatAmount = match ? Number(match[1]) : Number(tx.amount) * 1000;
        const cleanDesc = tx.desc.replace(/\|ARS:\d+(?:\.\d+)?$/, "").trim();

        return {
          type: "out" as const,
          id: `tx-${tx.id}`,
          groupId: g.id,
          groupName: getGroupName(g),
          contractAddress: g.contractAddress,
          user: uName,
          avatar: uName.substring(0,2).toUpperCase(),
          desc: cleanDesc || "Gasto general",
          amount: fiatAmount,
          // g.transactions ya viene revertido del relayer (idx 0 es el gasto más reciente on-chain).
          // Le asignamos a idx 0 el timestamp más alto para que aparezca arriba de todo.
          timestamp: baseTime - idx * 60000,
          status: tx.executed ? "Completado" : (tx.rejected ? "Rechazado" : "Pendiente")
        };
      });
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
            <span className="header-title">Movimientos en {getGroupName(group)}</span>
          </div>
        </div>
        
        <div style={{ background: "rgba(102, 87, 246, 0.08)", padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", fontSize: "0.8rem" }}>
          <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>⚡️ Monad Testnet</span>
          </span>
          {group.contractAddress && (
            <a 
              href={`https://testnet.monadscan.com/address/${group.contractAddress}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
            >
              <span>Contrato: {group.contractAddress.slice(0, 6)}...{group.contractAddress.slice(-4)}</span>
              <span>↗</span>
            </a>
          )}
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
                  {item.contractAddress && (
                    <a 
                      href={`https://testnet.monadscan.com/address/${item.contractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "0.72rem",
                        color: "var(--primary)",
                        textDecoration: "none",
                        marginTop: "4px",
                        fontWeight: 500
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>⛓️ Monadscan</span>
                      <span style={{ fontSize: "0.68rem" }}>↗</span>
                    </a>
                  )}
                </div>
                <div>
                  <div className={`tx-amount ${item.type === "out" ? "negative" : "positive"}`} style={{ color: item.type === "in" ? "var(--primary)" : "inherit" }}>
                    {item.type === "out" ? "- " : "+ "}{fmt(item.amount)}
                  </div>
                  <div className="tx-date" style={{ color: item.status === "Pendiente" ? "orange" : item.status === "Rechazado" ? "red" : "var(--text-muted)" }}>
                    {item.status}
                  </div>
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "8px", marginBottom: "12px" }}>
                <h3 style={{ fontSize: "1.1rem", margin: 0 }}>
                  {getGroupName(g)}
                </h3>
                {g.contractAddress && (
                  <a 
                    href={`https://testnet.monadscan.com/address/${g.contractAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: "0.75rem", color: "var(--primary)", textDecoration: "none", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "2px" }}
                  >
                    <span>⚡️ {g.contractAddress.slice(0, 6)}...{g.contractAddress.slice(-4)}</span>
                    <span>↗</span>
                  </a>
                )}
              </div>
              <div className="tx-list">
                {m.map(item => (
                  <div className="tx-item" key={item.id} style={{ padding: "8px 0" }}>
                    <div className="tx-avatar" style={{ background: item.type === "in" ? "var(--primary-light)" : "var(--bg-2)", color: item.type === "in" ? "white" : "inherit" }}>
                      {item.avatar}
                    </div>
                    <div className="tx-details">
                      <div className="tx-user">{item.type === "in" ? item.user : `Miembro ${item.user}...`}</div>
                      <div className="tx-desc">{item.desc}</div>
                      {item.contractAddress && (
                        <a 
                          href={`https://testnet.monadscan.com/address/${item.contractAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "0.72rem",
                            color: "var(--primary)",
                            textDecoration: "none",
                            marginTop: "4px",
                            fontWeight: 500
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>⛓️ Monadscan</span>
                          <span style={{ fontSize: "0.68rem" }}>↗</span>
                        </a>
                      )}
                    </div>
                    <div>
                      <div className={`tx-amount ${item.type === "out" ? "negative" : "positive"}`} style={{ color: item.type === "in" ? "var(--primary)" : "inherit" }}>
                        {item.type === "out" ? "- " : "+ "}{fmt(item.amount)}
                      </div>
                      <div className="tx-date" style={{ color: item.status === "Pendiente" ? "orange" : item.status === "Rechazado" ? "red" : "var(--text-muted)" }}>
                        {item.status}
                      </div>
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


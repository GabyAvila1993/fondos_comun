import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import type { UserStats, Group, NotificationHistory } from "../../types";
import { User, Bell, IdentificationCard, CreditCard, Password, ChatCircle, CaretRight, PencilSimple, CheckCircle, X } from "@phosphor-icons/react";
import Sheet from "../Sheet";

interface MiCuentaTabProps {
  userAddress: string;
  userEmail: string;
  stats: UserStats | null;
  groups?: Group[];
  readVotes?: string[];
  notificationsHistory?: NotificationHistory[];
  onMarkAsRead?: (ids: string[]) => void;
  onNavigateToVote?: (groupId: string) => void;
  onNavigateToGroup?: (groupId: string) => void;
  onEditName?: (newName: string) => void;
  onLogout: () => void;
}

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

export default function MiCuentaTab({ userAddress, userEmail, stats, groups = [], readVotes = [], notificationsHistory = [], onMarkAsRead, onNavigateToVote, onNavigateToGroup, onEditName, onLogout }: MiCuentaTabProps) {
  const defaultName = userEmail ? userEmail.split('@')[0] : "Usuario";
  const [userName, setUserName] = useState(() => localStorage.getItem("monad_username") || defaultName);

  const handleEditName = () => {
    const newName = prompt("Ingresa tu nuevo nombre de usuario:", userName);
    if (newName && newName.trim()) {
      setUserName(newName.trim());
      localStorage.setItem("monad_username", newName.trim());
      if (onEditName) onEditName(newName.trim());
    }
  };

  // Use real stats or fallback to 0
  const totalDeposited = stats?.totalDeposited ? Number(stats.totalDeposited) * 1000 : 0;
  const groupsCount = stats?.groupsCount || 0;

  const pendingVotes = groups.flatMap(g => {
    const txs = (g.pending || []).map((p: any) => ({ id: `tx-${p.id}`, type: "gasto", title: p.desc || "Solicitud de gasto", group: g }));
    const limits = (g.pendingLimitProposals || []).map((p: any) => ({ id: `lim-${p.id}`, type: "límite", title: "Cambio de límite", group: g }));
    const deletes = (g.deleteProposals || []).filter((p: any) => p.status === "pending").map((p: any) => ({ id: `del-${p.id}`, type: "eliminación", title: "Eliminar grupo", group: g }));
    return [...txs, ...limits, ...deletes];
  });
  
  const unreadVotes = pendingVotes.filter(v => !readVotes.includes(v.id));
  
  const [showVotesDropdown, setShowVotesDropdown] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  // Combina las notificaciones de DB con las extraídas del estado local (si quisieras).
  // Pero ahora usaremos principalmente notificationsHistory para historial
  // y unreadVotes para las acciones rapidas.
  const allHistory = [...notificationsHistory].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const historyTop5 = allHistory.slice(0, 5);
  
  return (
    <div>
      <div className="header-green" style={{ paddingBottom: "24px", borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
        <div className="header-top" style={{ marginBottom: 0 }}>
          <span className="header-title">Mi Cuenta</span>
        </div>
      </div>
      
      <div style={{ background: "var(--bg-color)" }}>
        <div className="profile-info" style={{ paddingTop: "24px" }}>
          <div className="profile-avatar">
            <User weight="fill" />
          </div>
          <div>
            <div className="profile-name" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {userName}
              <PencilSimple 
                size={16} 
                weight="bold" 
                color="var(--primary)" 
                style={{ cursor: "pointer" }} 
                onClick={handleEditName}
              />
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "4px" }}>
              {userAddress.substring(0, 6)}...{userAddress.substring(userAddress.length - 4)}
            </div>
            <div className="profile-badge">
              <CheckCircle weight="fill" /> Miembro Verificado
            </div>
          </div>
        </div>

        <div className="analytics-summary">
          <div className="analytics-item">
            <div className="analytics-label">Total Aportado</div>
            <div className="analytics-value">{fmt(totalDeposited)}</div>
          </div>
          <div className="analytics-item" style={{ textAlign: "right" }}>
            <div className="analytics-label">Grupos Activos</div>
            <div className="analytics-value">{groupsCount}</div>
          </div>
        </div>

        <div style={{ padding: "0 20px" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px", marginTop: "16px" }}>
            AJUSTES Y ATAJOS
          </div>
          
          <div className="card" style={{ padding: "0 16px", margin: "0" }}>
            <div className="settings-item" onClick={() => {
              if (unreadVotes.length > 0 || historyTop5.length > 0) {
                setShowVotesDropdown(!showVotesDropdown);
              } else {
                toast("No hay notificaciones", { icon: "👍" });
              }
            }}>
              <div className="settings-icon" style={{ position: "relative" }}>
                <Bell />
                {(unreadVotes.length > 0 || allHistory.some(n => !n.read)) && (
                  <div style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    background: "red",
                    color: "white",
                    fontSize: "0.6rem",
                    fontWeight: "bold",
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    {unreadVotes.length + allHistory.filter(n => !n.read).length}
                  </div>
                )}
              </div>
              <div className="settings-text">
                <div className="settings-title">Notificaciones</div>
                <div className="settings-desc">Alertas e historial de actividad</div>
              </div>
              <CaretRight color="var(--text-muted)" style={{ transform: showVotesDropdown ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
            </div>

            {showVotesDropdown && (unreadVotes.length > 0 || historyTop5.length > 0) && (
              <div style={{ padding: "0 16px 16px", borderBottom: "1px solid var(--border)" }}>
                {unreadVotes.map((v, i) => (
                  <div key={i} onClick={() => onNavigateToVote && onNavigateToVote(v.group.id)} style={{ padding: "8px", background: "var(--bg-color)", borderRadius: "8px", marginBottom: "8px", cursor: "pointer", fontSize: "0.85rem" }}>
                    <div style={{ fontWeight: 600 }}>{v.group.name || v.group.editedName}</div>
                    <div style={{ color: "var(--text-muted)" }}>{v.title} ({v.type})</div>
                  </div>
                ))}
                {historyTop5.map((n, i) => {
                  const isRejectAlert = n.message.includes("transfiriendo el grupo");
                  return (
                    <div 
                      key={`db-${i}`} 
                      style={{ 
                        padding: "8px", 
                        background: "var(--bg-color)", 
                        borderRadius: "8px", 
                        marginBottom: "8px", 
                        fontSize: "0.85rem", 
                        display: 'flex', 
                        flexDirection: 'column',
                        cursor: isRejectAlert && onNavigateToGroup ? "pointer" : "default"
                      }}
                      onClick={() => {
                        if (isRejectAlert && onNavigateToGroup) {
                          onNavigateToGroup(n.groupId);
                        }
                      }}
                    >
                      <div style={{ fontWeight: 600, color: n.read ? "var(--text-muted)" : "var(--text-main)" }}>{n.title} {!n.read && <span style={{color: 'red'}}>•</span>}</div>
                      <div style={{ color: "var(--text-muted)" }}>{n.message}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: 4 }}>{new Date(n.createdAt).toLocaleString()}</div>
                    </div>
                  );
                })}
                {allHistory.length > 5 && (
                  <button 
                    style={{ width: "100%", padding: "8px", background: "transparent", border: "1px solid var(--border)", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "var(--primary)", marginBottom: "8px" }}
                    onClick={() => {
                      setShowHistoryModal(true);
                      setShowVotesDropdown(false);
                    }}
                  >
                    Ver más
                  </button>
                )}
                {onMarkAsRead && (
                  <button 
                    style={{ width: "100%", padding: "8px", background: "var(--border)", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-color)" }}
                    onClick={() => {
                      const localIds = unreadVotes.map(v => v.id);
                      const dbIds = allHistory.filter(n => !n.read).map(n => n.id);
                      onMarkAsRead([...localIds, ...dbIds]);
                      setShowVotesDropdown(false);
                    }}
                  >
                    Marcar como leídas
                  </button>
                )}
              </div>
            )}

            <div className="settings-item" onClick={() => toast("Próximamente", { icon: "🚧" })}>
              <div className="settings-icon"><IdentificationCard /></div>
              <div className="settings-text">
                <div className="settings-title">Miembros y permisos</div>
                <div className="settings-desc">Gestionar roles en grupos</div>
              </div>
              <CaretRight color="var(--text-muted)" />
            </div>
            <div className="settings-item" onClick={() => toast("Próximamente", { icon: "🚧" })}>
              <div className="settings-icon"><CreditCard /></div>
              <div className="settings-text">
                <div className="settings-title">Métodos de carga</div>
                <div className="settings-desc">Vincular tarjetas o cuentas</div>
              </div>
              <CaretRight color="var(--text-muted)" />
            </div>
          </div>
          
          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px", marginTop: "24px" }}>
            SEGURIDAD
          </div>
          
          <div className="card" style={{ padding: "0 16px", margin: "0" }}>
            <div className="settings-item" onClick={() => toast("Próximamente", { icon: "🚧" })}>
              <div className="settings-icon"><Password /></div>
              <div className="settings-text">
                <div className="settings-title">PIN de Aprobación</div>
                <div className="settings-desc">Requerir clave para votar</div>
              </div>
              <CaretRight color="var(--text-muted)" />
            </div>
          </div>

          <button className="logout-btn" onClick={onLogout}>Cerrar Sesión</button>
        </div>
      </div>

      <Sheet isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} title="Historial de Notificaciones">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '70vh', overflowY: 'auto', paddingBottom: '20px' }}>
          {allHistory.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px 0" }}>
              No hay notificaciones en el historial.
            </div>
          ) : (
            allHistory.map((n) => {
              const isRejectAlert = n.message.includes("transfiriendo el grupo");
              return (
                <div 
                  key={n.id} 
                  style={{ 
                    padding: "12px", 
                    background: "var(--card-bg)", 
                    borderRadius: "12px", 
                    border: "1px solid var(--border)",
                    cursor: isRejectAlert && onNavigateToGroup ? "pointer" : "default"
                  }}
                  onClick={() => {
                    if (isRejectAlert && onNavigateToGroup) {
                      setShowHistoryModal(false);
                      onNavigateToGroup(n.groupId);
                    }
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                    <div style={{ fontWeight: 600, color: n.read ? "var(--text-muted)" : "var(--text-main)" }}>
                      {n.title} {!n.read && <span style={{ color: "red", fontSize: "1.2em", lineHeight: "0" }}>•</span>}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {new Date(n.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>{n.message}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "8px" }}>
                    {new Date(n.createdAt).toLocaleTimeString()} - {n.type}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Sheet>
    </div>
  );
}



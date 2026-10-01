import { useState } from "react";
import type { Group } from "../../types";
import { Plus, Wallet, FileText, Users, ShareNetwork, CaretDown, Trash } from "@phosphor-icons/react";
import toast from "react-hot-toast";
import Sheet from "../Sheet";
interface InicioTabProps {
  groups: Group[];
  activeGroupId: string;
  userId?: string;
  onSelectGroup: (id: string) => void;
  onGroupClick: (id: string) => void;
  onNewGroup: () => void;
  onDeposit: () => void;
  onDeposit: () => void;
  onSpend: () => void;
  onProposeLimit: () => void;
  onDeleteGroup: (id: string) => void;
}

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

export default function InicioTab({ groups, activeGroupId, userId, onSelectGroup, onGroupClick, onNewGroup, onDeposit, onSpend, onProposeLimit, onDeleteGroup }: InicioTabProps) {
  const activeGroup = groups.find((g) => g.id === activeGroupId);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);

  const handleShare = (e: React.MouseEvent, groupId: string) => {
    e.stopPropagation();
    const inviteLink = `${window.location.origin}/?join=${groupId}`;
    navigator.clipboard.writeText(inviteLink);
    toast.success("¡Enlace de invitación copiado!");
  };

  return (
    <div>
      {/* Header Verde */}
      <div className="header-green">
        <div className="header-top">
          <div className="flex items-center gap-2">
            <img src="/icon.png" alt="Logo" style={{ width: 24, height: 24 }} />
            <span className="header-title">Fondo Común</span>
          </div>
          <div className="custom-dropdown-container">
            <button 
              className="custom-dropdown-button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              {activeGroup ? activeGroup.name : "Seleccionar grupo"}
              <CaretDown weight="bold" />
            </button>

            
            {isDropdownOpen && (
              <div className="custom-dropdown-menu">
                {groups.map((g) => (
                  <div 
                    key={g.id} 
                    className="custom-dropdown-item"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <span onClick={() => {
                      onSelectGroup(g.id);
                      setIsDropdownOpen(false);
                    }} style={{ flexGrow: 1 }}>{g.name}</span>
                    
                    {g.isCreator && (
                      <Trash 
                        weight="fill" 
                        size={20} 
                        color="#ff4444" 
                        style={{ cursor: 'pointer', paddingLeft: '8px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setGroupToDelete(g);
                          setIsDropdownOpen(false);
                        }} 
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <Sheet isOpen={!!groupToDelete} onClose={() => setGroupToDelete(null)} title="Eliminar grupo">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ color: 'var(--text-muted)' }}>
              ¿Estás seguro que deseas eliminar el grupo <strong>{groupToDelete?.name}</strong>?
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9em' }}>
              Esta acción no se puede deshacer y todos los miembros perderán el acceso.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button 
                onClick={() => setGroupToDelete(null)}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-color)', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  if (groupToDelete) {
                    onDeleteGroup(groupToDelete.id);
                    setGroupToDelete(null);
                  }
                }}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#ff4444', color: 'white', fontWeight: 600, cursor: 'pointer' }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </Sheet>

        {activeGroup ? (
          <div className="balance-section">
            <div className="balance-label">Fondo disponible</div>
            <div className="balance-amount">{fmt(Number(activeGroup.balance || 0) * 1000)}</div>
            <div className="limit-info mt-2" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <span>Límite libre por persona: <span style={{ fontWeight: 600 }}>{fmt(Number(activeGroup.creditLimit) * 1000)}</span></span>
              {activeGroup.isCreator && (
                <button 
                  onClick={onProposeLimit}
                  style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.3)", padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem", color: "white", cursor: "pointer" }}
                >
                  Cambiar
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center" style={{ padding: "20px 0" }}>
            <div className="balance-label">No tienes grupos activos</div>
            <div className="balance-amount">$0</div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-card">
        <button className="action-btn" onClick={onDeposit}>
          <div className="action-icon icon-green"><Plus weight="bold" /></div>
          <span>Ingresar dinero</span>
        </button>
        <button className="action-btn" onClick={onSpend}>
          <div className="action-icon icon-yellow"><Wallet weight="fill" /></div>
          <span>Retirar</span>
        </button>
        <button className="action-btn" onClick={onSpend}>
          <div className="action-icon icon-purple"><FileText weight="fill" /></div>
          <span>Pedir monto mayor</span>
        </button>
        <button className="action-btn" onClick={onNewGroup}>
          <div className="action-icon icon-gray"><Users weight="fill" /></div>
          <span>Crear nuevo grupo</span>
        </button>
      </div>

      {/* Tus Grupos */}
      <div className="card" style={{ padding: "0" }}>
        <div className="card-title" style={{ padding: "20px 20px 8px" }}>
          Tus grupos
          <span style={{ fontSize: "0.8rem", color: "var(--primary-light)", cursor: "pointer", fontWeight: 500 }}>Ver todos</span>
        </div>
        <div className="group-list" style={{ padding: "0 20px 8px" }}>
          {groups.map((g) => (
            <div className="group-list-item" key={g.id} onClick={() => onGroupClick(g.id)}>
              <div className="group-avatar">{g.name.substring(0, 2).toUpperCase()}</div>
              <div className="group-info">
                <div className="group-name">{g.name}</div>
                <div className="group-meta">{g.members?.length || 1} de {g.members?.length || 1} miembros</div>
              </div>
              <div className="group-balance">{fmt(Number(g.balance || 0) * 1000)}</div>
              <button 
                onClick={(e) => handleShare(e, g.id)}
                style={{ 
                  background: "transparent", 
                  color: "var(--primary-light)", 
                  padding: "8px", 
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <ShareNetwork size={20} weight="bold" />
              </button>
            </div>
          ))}
          {groups.length === 0 && (
            <div className="text-center text-muted" style={{ padding: "20px 0" }}>
              Aún no formas parte de ningún grupo.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

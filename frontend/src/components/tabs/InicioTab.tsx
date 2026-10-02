import { useState, useEffect } from "react";
import type { Group } from "../../types";
import { Plus, Wallet, FileText, Users, ShareNetwork, CaretDown, Trash, PencilSimple } from "@phosphor-icons/react";
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
  onSpend: () => void;
  onProposeLimit: () => void;
  onDeleteGroup: (id: string) => void;
  onRenameGroup: (id: string, newName: string) => void;
  onChangeAdminLeave: (groupId: string, newAdminId: string, newAdminWallet: string) => void;
  isLoadingDetails?: boolean;
}

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

export default function InicioTab({ groups, activeGroupId, userId, onSelectGroup, onGroupClick, onNewGroup, onDeposit, onSpend, onProposeLimit, onDeleteGroup, onRenameGroup, onChangeAdminLeave, isLoadingDetails }: InicioTabProps) {
  const activeGroup = groups.find((g) => g.id === activeGroupId);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [groupToRename, setGroupToRename] = useState<Group | null>(null);
  const [fiatToMonRate, setFiatToMonRate] = useState(1000);
  
  const [selectedNewAdminId, setSelectedNewAdminId] = useState<string>("");
  const [newAdminConfirmed, setNewAdminConfirmed] = useState(false);

  // Mantenemos la tasa de cambio actualizada para mostrar límites en ARS
  useEffect(() => {
    fetch("https://dolarapi.com/v1/dolares/cripto")
      .then(res => res.json())
      .then(data => {
        if (data.venta) setFiatToMonRate(data.venta);
      })
      .catch(console.error);
  }, []);

  const getFiatBalance = (g: Group) => {
    if (g.deposits === undefined) return undefined;
    const totalDeposits = g.deposits.reduce((acc: number, d: any) => acc + Number(d.amount), 0);
    const totalExpenses = (g.transactions || []).filter((t: any) => t.executed).reduce((acc: number, t: any) => {
      const match = (t.desc || "").match(/\|ARS:(\d+(?:\.\d+)?)$/);
      return acc + (match ? Number(match[1]) : Number(t.amount) * fiatToMonRate);
    }, 0);
    return totalDeposits - totalExpenses;
  };

  const getGroupName = (g: Group) => g.editedName || g.name;

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
              {activeGroup ? getGroupName(activeGroup) : "Seleccionar grupo"}
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
                    }} style={{ flexGrow: 1 }}>{getGroupName(g)}</span>
                    
                    {g.isCreator && !g.deleteProposals?.some(p => p.status === "pending" || p.status === "rejected") && (
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

        {activeGroup ? (
          <div className="balance-section">
            <div className="balance-label">Fondo disponible</div>
            {isLoadingDetails || activeGroup.deposits === undefined ? (
              <div className="loading-text-blink" style={{ color: "white", fontSize: "1.5rem", fontWeight: 600, padding: "10px 0" }}>Cargando saldo...</div>
            ) : (
              <div className="balance-amount">{fmt(getFiatBalance(activeGroup)!)}</div>
            )}
            <div className="limit-info mt-2" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <span>Límite libre por persona: <span style={{ fontWeight: 600 }}>{fmt(Number(activeGroup.creditLimit) * fiatToMonRate)}</span></span>
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
      {/* Alerta de Votación de Eliminación Denegada */}
      {activeGroup && activeGroup.isCreator && (activeGroup.deleteProposals || []).some(p => p.status === "rejected") && (
        <div style={{ background: "#fef2f2", margin: "0 20px 20px 20px", padding: "16px", borderRadius: "12px", border: "1px solid #fecaca" }}>
          <h4 style={{ color: "#991b1b", marginTop: 0, marginBottom: "8px" }}>Los participantes no quieren eliminar el grupo {getGroupName(activeGroup)}</h4>
          <p style={{ color: "#b91c1c", fontSize: "0.9rem", marginBottom: "16px" }}>
            Si vos te querés ir podés hacerlo transfiriendo el grupo a uno de los integrantes.
          </p>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <select 
              className="form-input" 
              style={{ background: "white" }}
              value={selectedNewAdminId}
              onChange={(e) => {
                setSelectedNewAdminId(e.target.value);
                setNewAdminConfirmed(false);
              }}
            >
              <option value="">Seleccionar nuevo administrador...</option>
              {activeGroup.members?.filter(m => m !== userId).map(memberId => (
                <option key={memberId} value={memberId}>
                  {activeGroup.usersMap?.[memberId]?.name || (activeGroup.usersMap?.[memberId]?.email ? activeGroup.usersMap[memberId].email!.split('@')[0] : `Usuario ${memberId.substring(0,6)}...`)}
                </option>
              ))}
            </select>
            
            {!newAdminConfirmed ? (
              <button 
                className="btn-outline"
                disabled={!selectedNewAdminId}
                onClick={() => setNewAdminConfirmed(true)}
                style={{ opacity: !selectedNewAdminId ? 0.5 : 1 }}
              >
                Confirmar nuevo admin
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn-outline"
                  onClick={() => setNewAdminConfirmed(false)}
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
                <button 
                  className="btn-primary"
                  onClick={() => {
                    const wallet = activeGroup.usersMap?.[selectedNewAdminId]?.walletAddress;
                    if (!wallet) {
                      toast.error("El usuario seleccionado no tiene una wallet válida.");
                      return;
                    }
                    onChangeAdminLeave(activeGroup.id, selectedNewAdminId, wallet);
                  }}
                  style={{ 
                    flex: 1,
                    background: "#dc2626",
                    color: "white",
                    border: "none"
                  }}
                >
                  Salir del grupo
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tus Grupos */}
      <div className="card" style={{ padding: "0" }}>
        <div className="card-title" style={{ padding: "20px 20px 8px" }}>
          Tus grupos
          <span style={{ fontSize: "0.8rem", color: "var(--primary-light)", cursor: "pointer", fontWeight: 500 }}>Ver todos</span>
        </div>
        <div className="group-list" style={{ padding: "0 20px 8px" }}>
          {groups.map((g) => (
            <div className="group-list-item" key={g.id} onClick={() => onGroupClick(g.id)}>
              <div className="group-avatar">{getGroupName(g).substring(0, 2).toUpperCase()}</div>
              <div className="group-info">
                <div className="group-name" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {getGroupName(g)}
                  {g.isCreator && (
                    <PencilSimple 
                      size={16} 
                      weight="bold" 
                      color="var(--primary)" 
                      style={{ cursor: "pointer" }} 
                      onClick={(e) => {
                        e.stopPropagation();
                        setGroupToRename(g);
                      }}
                    />
                  )}
                </div>
                <div className="group-meta">{g.members?.length || 1} de {g.members?.length || 1} miembros</div>
              </div>
              <div className="group-balance">
                {getFiatBalance(g) === undefined ? (
                  <span className="loading-text-blink" style={{ fontSize: "0.85rem", color: "var(--primary-light)" }}>Cargando saldo...</span>
                ) : (
                  fmt(getFiatBalance(g)!)
                )}
              </div>
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

      {/* Modals */}
      <Sheet isOpen={!!groupToDelete} onClose={() => setGroupToDelete(null)} title="Eliminar grupo">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {groupToDelete && groupToDelete.members && groupToDelete.members.length > 1 ? (
            <p style={{ color: 'var(--text-muted)' }}>
              ¿Estás seguro que deseas eliminar el grupo <strong>{getGroupName(groupToDelete)}</strong>?
              <br/><br/>
              El grupo tiene otros miembros. Se abrirá una votación para eliminarlo.
            </p>
          ) : (
            <>
              <p style={{ color: 'var(--text-muted)' }}>
                ¿Estás seguro que deseas eliminar el grupo <strong>{groupToDelete ? getGroupName(groupToDelete) : ''}</strong>?
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9em' }}>
                Esta acción no se puede deshacer y todos los miembros perderán el acceso.
              </p>
            </>
          )}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button 
              onClick={() => setGroupToDelete(null)}
              style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer' }}
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
              {groupToDelete && groupToDelete.members && groupToDelete.members.length > 1 ? "Abrir votación" : "Eliminar"}
            </button>
          </div>
        </div>
      </Sheet>

      <Sheet isOpen={!!groupToRename} onClose={() => setGroupToRename(null)} title="Editar nombre de grupo">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '8px' }}>
          <p style={{ color: "var(--text-muted)", marginBottom: "0px", marginTop: "-16px" }}>
            Ingresa el nuevo nombre que deseas asignarle a este grupo.
          </p>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Nuevo nombre del grupo</label>
            <input 
              type="text" 
              id="rename-input"
              className="form-input" 
              defaultValue={groupToRename ? getGroupName(groupToRename) : ''}
              placeholder="Ej. Vacaciones Mdz"
            />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="btn-outline"
              style={{ flex: 1 }}
              onClick={() => setGroupToRename(null)}
            >
              Cancelar
            </button>
            <button 
              className="btn-primary"
              style={{ flex: 1 }}
              onClick={() => {
                const input = document.getElementById("rename-input") as HTMLInputElement;
                const newName = input?.value;
                if (groupToRename && newName && newName.trim() && newName.trim() !== getGroupName(groupToRename)) {
                  onRenameGroup(groupToRename.id, newName.trim());
                  setGroupToRename(null);
                }
              }}
            >
              Aceptar
            </button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

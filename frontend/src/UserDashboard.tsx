import { useState, useEffect, useRef } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { api } from "./compartido/lib/api";
import { signTyped } from "./compartido/lib/eip712";
import toast from "react-hot-toast";
import type { Group, UserStats, NotificationHistory } from "./compartido/tipos";

// Componentes
import BottomNav, { Tab } from "./compartido/componentes/BottomNav";
import InicioTab from "./grupos/componentes/InicioTab";
import MovimientosTab from "./movimientos/componentes/MovimientosTab";
import AprobacionesTab from "./aprobaciones/componentes/AprobacionesTab";
import UnirseTab from "./unirse/componentes/UnirseTab";
import MiCuentaTab from "./cuenta/componentes/MiCuentaTab";
import Sheet from "./compartido/componentes/Sheet";
import GroupForms from "./grupos/componentes/GroupForms";

export default function UserDashboard() {
  const { user, getAccessToken, logout } = usePrivy();
  const { wallets } = useWallets();
  const [activeTab, setActiveTab] = useState<Tab>("inicio");
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string>("");
  const activeGroupIdRef = useRef(activeGroupId);
  useEffect(() => { activeGroupIdRef.current = activeGroupId; }, [activeGroupId]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [forceGlobal, setForceGlobal] = useState(false);
  const [notificationsHistory, setNotificationsHistory] = useState<NotificationHistory[]>([]);

  const [readVotes, setReadVotes] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("monad_read_votes") || "[]");
    } catch {
      return [];
    }
  });

  // UI State
  const [sheetView, setSheetView] = useState<"new_group" | "deposit" | "spend" | "join_group" | "propose_limit" | null>(null);
  const [joinGroupData, setJoinGroupData] = useState<Group | undefined>(undefined);

  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      loadBasicData();
    }
    
    const handleRefresh = () => {
      loadBasicData();
    };
    
    const handleRefreshGroup = (e: Event) => {
      const customEvent = e as CustomEvent;
      const groupId = customEvent.detail;
      if (groupId === activeGroupIdRef.current) {
        fetchGroupDetails(groupId);
      }
    };

    const handleSocketVote = (e: Event) => {
      const data = (e as CustomEvent).detail;
      const currentDbUserId = localStorage.getItem("monad_dbUserId");
      if ((currentDbUserId && data.targetUserId === currentDbUserId) || (currentDbUserId && data.targetUserIds?.includes(currentDbUserId))) {
        toast(data.message, {
          icon: "🗳️",
          style: { borderRadius: '10px', background: 'var(--card-bg)', color: 'var(--text-color)', border: '1px solid var(--border-color)' },
        });
        if (data.groupId) fetchGroupDetails(data.groupId, 500);
      }
    };

    const handleSocketGroupDeleted = (e: Event) => {
      const data = (e as CustomEvent).detail;
      const currentDbUserId = localStorage.getItem("monad_dbUserId");
      if ((currentDbUserId && data.targetUserId === currentDbUserId) || (currentDbUserId && data.targetUserIds?.includes(currentDbUserId))) {
        toast(data.message, {
          icon: "🗑️",
          style: { borderRadius: '10px', background: 'var(--card-bg)', color: '#ff4444', border: '1px solid #ff4444' },
        });
        loadBasicData();
      }
    };

    const handleSocketSystem = (e: Event) => {
      const data = (e as CustomEvent).detail;
      const currentDbUserId = localStorage.getItem("monad_dbUserId");
      if ((!data.targetUserId && (!data.targetUserIds || data.targetUserIds.length === 0)) || (currentDbUserId && data.targetUserId === currentDbUserId) || (currentDbUserId && data.targetUserIds?.includes(currentDbUserId))) {
        toast(data.message, {
          icon: "👋",
          style: { borderRadius: '10px', background: 'var(--card-bg)', color: 'var(--text-color)', border: '1px solid var(--border-color)' },
        });
        if (data.groupId) fetchGroupDetails(data.groupId, 500);
        else loadBasicData();
      }
    };

    window.addEventListener("group_deleted_refresh", handleRefresh);
    window.addEventListener("refresh_group", handleRefreshGroup);
    window.addEventListener("socket_vote", handleSocketVote);
    window.addEventListener("socket_group_deleted", handleSocketGroupDeleted);
    window.addEventListener("socket_system", handleSocketSystem);
    
    return () => {
      window.removeEventListener("group_deleted_refresh", handleRefresh);
      window.removeEventListener("refresh_group", handleRefreshGroup);
      window.removeEventListener("socket_vote", handleSocketVote);
      window.removeEventListener("socket_group_deleted", handleSocketGroupDeleted);
      window.removeEventListener("socket_system", handleSocketSystem);
    };
  }, [user]);

  const loadBasicData = async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      const basicGroups = await api.listGroups(token);
      
      setGroups(prev => {
        return basicGroups.map((bg: any) => {
          const existing = prev.find(p => p.id === bg.id);
          return existing ? { ...existing, ...bg } : bg;
        });
      });
      
      if (basicGroups.length > 0) {
        if (basicGroups[0].currentUserId) {
          localStorage.setItem("monad_dbUserId", basicGroups[0].currentUserId);
        }
        if (!activeGroupId) {
          setActiveGroupId(basicGroups[0].id);
        }
      }

      try {
        const statsData = await api.getMyStats(token);
        // statsData is now { stats: any[], currentUserId: string }
        if (statsData.currentUserId) {
          localStorage.setItem("monad_dbUserId", statsData.currentUserId);
        }
        const totalDeposited = statsData.stats.reduce((acc: any, curr: any) => acc + curr.amountDeposited, 0);
        setUserStats({
          totalDeposited: String(totalDeposited),
          groupsCount: statsData.stats.length
        });
      } catch (e) {
        console.warn("Could not load user stats", e);
      }

      try {
        const historyData = await api.getNotifications(token);
        setNotificationsHistory(historyData);
      } catch (e) {
        console.warn("Could not load notification history", e);
      }

      // Check for ?join=ID in URL
      const searchParams = new URLSearchParams(window.location.search);
      const joinId = searchParams.get("join");
      if (joinId) {
        // Remove it from URL so it doesn't trigger again on reload
        window.history.replaceState({}, document.title, "/");
        
        // Let's check if the user is already in this group
        const existing = basicGroups.find(g => g.id === joinId);
        if (existing) {
          toast("Ya eres miembro de este grupo.", { icon: "ℹ️" });
          setActiveGroupId(existing.id);
        } else {
          // Fetch group info from backend
          try {
            const joinGroup = await api.getGroup(token, joinId);
            setJoinGroupData(joinGroup);
            setSheetView("join_group");
          } catch (err) {
            toast.error("No se pudo cargar el grupo al que te invitaron.");
          }
        }
      }
    } catch (e) {
      console.error("Error loading data", e);
    }
  };

  useEffect(() => {
    if (activeGroupId && user) {
      fetchGroupDetails(activeGroupId);
    }
  }, [activeGroupId, user]);

  const handleCancelDeleteProposal = async (groupId: string) => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      const tid = toast.loading("Cancelando propuesta de eliminación...");
      await api.clearDeleteProposal(token, groupId);
      toast.success("Propuesta cancelada con éxito.", { id: tid });
      fetchGroupDetails(groupId);
    } catch (e: any) {
      toast.error(e.message || "Error al cancelar la propuesta");
    }
  };

  useEffect(() => {
  const loadMissingDetails = async () => {
      const token = await getAccessToken();
      if (!token) return;
      for (const g of groups) {
        if (g.deposits === undefined && g.id !== activeGroupId) {
          try {
            const full = await api.getGroup(token, g.id);
            setGroups(prev => prev.map(pg => pg.id === g.id ? { ...pg, ...full, isCreator: pg.isCreator } : pg));
          } catch (e) {
            console.error("Error background fetching group", g.id, e);
          }
        }
      }
    };
    if (groups.length > 0 && user) {
      loadMissingDetails();
    }
  }, [groups, user, activeGroupId]);

  const fetchGroupDetails = async (id: string, delayMs = 0) => {
    setIsLoadingDetails(true);
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    try {
      const token = await getAccessToken();
      if (!token) return;
      const full = await api.getGroup(token, id);
      setGroups(prev => prev.map(g => g.id === id ? { ...g, ...full, isCreator: g.isCreator } : g));
    } catch (e) {
      console.error("Error fetching group details", e);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const activeGroup = groups.find((g) => g.id === activeGroupId);

  const handleJoinInit = async (groupId: string) => {
    try {
      const token = await getAccessToken();
      const existing = groups.find(g => g.id === groupId);
      if (existing) {
        toast("Ya eres miembro de este grupo.", { icon: "ℹ️" });
        setActiveGroupId(existing.id);
        setActiveTab("movimientos");
      } else {
        const joinGroup = await api.getGroup(token!, groupId);
        setJoinGroupData(joinGroup);
        setSheetView("join_group");
      }
    } catch (err) {
      toast.error("No se pudo cargar el grupo al que intentas unirte.");
    }
  };

  const handleApprove = async (txId: number) => {
    if (!activeGroup) return;
    let tid: string | undefined;
    try {
      const token = await getAccessToken();
      if (!token) return;

      const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
      if (!embeddedWallet) throw new Error("Wallet no encontrada");

      const { nonce } = await api.getNonce(token, activeGroup.id);
      
      const message = {
        voter: user?.wallet?.address,
        txId,
        approve: true,
        nonce: parseInt(nonce, 10),
      };

      const signature = await signTyped(embeddedWallet, "Vote", activeGroup.contractAddress, message);

      tid = toast.loading("Aprobando gasto...");
      const start = Date.now();
      await api.vote(token, activeGroup.id, {
        txId,
        approve: true,
        nonce,
        signature
      });
      const end = Date.now();

      toast.success(`¡Gasto aprobado en ${(end-start)/1000}s! ⚡️`, { id: tid });
      setReadVotes(prev => [...prev, `tx-${txId}`]);
      fetchGroupDetails(activeGroup.id);
    } catch (err: any) {
      toast.error("Error al aprobar: " + err.message);
      toast.dismiss(tid);
    }
  };

  const handleReject = async (txId: number) => {
    if (!activeGroup) return;
    let tid: string | undefined;
    try {
      const token = await getAccessToken();
      if (!token) return;

      const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
      if (!embeddedWallet) throw new Error("Wallet no encontrada");

      const { nonce } = await api.getNonce(token, activeGroup.id);
      
      const message = {
        voter: user?.wallet?.address,
        txId,
        approve: false,
        nonce: parseInt(nonce, 10),
      };

      const signature = await signTyped(embeddedWallet, "Vote", activeGroup.contractAddress, message);

      tid = toast.loading("Rechazando gasto...");
      const start = Date.now();
      await api.vote(token, activeGroup.id, {
        txId,
        approve: false,
        nonce,
        signature
      });
      const end = Date.now();

      toast.success(`¡Gasto rechazado en ${(end-start)/1000}s! ⚡️`, { id: tid });
      setReadVotes(prev => [...prev, `tx-${txId}`]);
      fetchGroupDetails(activeGroup.id);
    } catch (err: any) {
      toast.error("Error al rechazar: " + err.message);
      toast.dismiss(tid);
    }
  };

  const handleApproveLimit = async (proposalId: number) => {
    if (!activeGroup) return;
    let tid: string | undefined;
    try {
      const token = await getAccessToken();
      if (!token) return;

      const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
      if (!embeddedWallet) throw new Error("Wallet no encontrada");

      const { nonce } = await api.getNonce(token, activeGroup.id);
      
      const message = {
        voter: user?.wallet?.address,
        id: proposalId,
        approve: true,
        nonce: parseInt(nonce, 10)
      };

      const signature = await signTyped(embeddedWallet, "VoteLimit", activeGroup.contractAddress, message);

      tid = toast.loading("Aprobando cambio de límite...");
      const start = Date.now();
      await api.voteLimitChange(token, activeGroup.id, {
        proposalId,
        approve: true,
        nonce,
        signature
      });
      const end = Date.now();

      toast.success(`¡Cambio de límite aprobado en ${(end-start)/1000}s! ⚡️`, { id: tid });
      setReadVotes(prev => [...prev, `lim-${proposalId}`]);
      fetchGroupDetails(activeGroup.id);
    } catch (err: any) {
      toast.error("Error al aprobar: " + err.message);
      toast.dismiss(tid);
    }
  };

  const handleRejectLimit = async (proposalId: number) => {
    if (!activeGroup) return;
    let tid: string | undefined;
    try {
      const token = await getAccessToken();
      if (!token) return;

      const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
      if (!embeddedWallet) throw new Error("Wallet no encontrada");

      const { nonce } = await api.getNonce(token, activeGroup.id);
      
      const message = {
        voter: user?.wallet?.address,
        id: proposalId,
        approve: false,
        nonce: parseInt(nonce, 10)
      };

      const signature = await signTyped(embeddedWallet, "VoteLimit", activeGroup.contractAddress, message);

      tid = toast.loading("Rechazando cambio de límite...");
      const start = Date.now();
      await api.voteLimitChange(token, activeGroup.id, {
        proposalId,
        approve: false,
        nonce,
        signature
      });
      const end = Date.now();

      toast.success(`¡Cambio de límite rechazado en ${(end-start)/1000}s! ⚡️`, { id: tid });
      setReadVotes(prev => [...prev, `lim-${proposalId}`]);
      fetchGroupDetails(activeGroup.id);
    } catch (err: any) {
      toast.error("Error al rechazar: " + err.message);
      toast.dismiss(tid);
    }
  };

  const handleApproveDelete = async (proposalId: string) => {
    if (!activeGroup) return;
    let tid: string | undefined;
    try {
      const token = await getAccessToken();
      if (!token) return;
      tid = toast.loading("Aprobando eliminación...");
      await api.voteDelete(token, activeGroup.id, { proposalId, approve: true });
      toast.success("Eliminación aprobada", { id: tid });
      setReadVotes(prev => [...prev, `del-${proposalId}`]);
      fetchGroupDetails(activeGroup.id);
      
      // If it got deleted, refresh list
      setTimeout(() => loadBasicData(), 1000);
    } catch (err: any) {
      toast.error("Error al aprobar: " + err.message);
      toast.dismiss(tid);
    }
  };

  const handleRejectDelete = async (proposalId: string) => {
    if (!activeGroup) return;
    let tid: string | undefined;
    try {
      const token = await getAccessToken();
      if (!token) return;
      tid = toast.loading("Rechazando eliminación...");
      await api.voteDelete(token, activeGroup.id, { proposalId, approve: false });
      toast.success("Eliminación rechazada", { id: tid });
      setReadVotes(prev => [...prev, `del-${proposalId}`]);
      fetchGroupDetails(activeGroup.id);
    } catch (err: any) {
      toast.error("Error al rechazar: " + err.message);
      toast.dismiss(tid);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      const group = groups.find(g => g.id === groupId);
      if (!group) return;

      if (group.members && group.members.length > 1) {
        const tid = toast.loading("Proponiendo eliminación...");
        await api.proposeDelete(token, groupId);
        toast.success("Propuesta de eliminación creada", { id: tid });
        fetchGroupDetails(groupId);
      } else {
        const tid = toast.loading("Eliminando grupo...");
        await api.deleteGroup(token, groupId);
        toast.success("Grupo eliminado", { id: tid });
        setGroups(prev => prev.filter(g => g.id !== groupId));
        if (activeGroupId === groupId) setActiveGroupId("");
      }
    } catch (err: any) {
      toast.error("Error al eliminar: " + err.message);
    }
  };

  const handleRenameGroup = async (groupId: string, newName: string) => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      const tid = toast.loading("Actualizando nombre...");
      await api.updateGroup(token, groupId, { name: newName });
      toast.success("Nombre actualizado", { id: tid });
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, editedName: newName } : g));
    } catch (err: any) {
      toast.error("Error al actualizar: " + err.message);
    }
  };

  const handleChangeAdminLeave = async (groupId: string, newAdminId: string, newAdminWallet: string) => {
    if (!activeGroup) return;
    let tid: string | undefined;
    try {
      const token = await getAccessToken();
      if (!token) return;

      const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
      if (!embeddedWallet) throw new Error("Wallet no encontrada");

      const { nonce } = await api.getNonce(token, activeGroup.id);
      
      const message = {
        currentAdmin: user?.wallet?.address,
        newAdmin: newAdminWallet,
        nonce: parseInt(nonce, 10)
      };

      tid = toast.loading("Firmando transferencia y salida...");
      const signature = await signTyped(embeddedWallet, "ChangeAdmin", activeGroup.contractAddress, message);

      toast.loading("Procesando salida...", { id: tid });
      const start = Date.now();
      await api.changeAdminLeave(token, activeGroup.id, {
        newAdminId,
        newAdminWallet,
        nonce: parseInt(nonce, 10),
        signature
      });
      const end = Date.now();

      toast.success(`¡Transferencia completada en ${(end-start)/1000}s! ⚡️`, { id: tid });
      
      // Update UI immediately
      setGroups(prev => prev.filter(g => g.id !== groupId));
      setActiveGroupId("");
      
      // Removed from group, refresh full list
      setTimeout(() => {
        loadBasicData();
      }, 1000);
    } catch (err: any) {
      toast.error("Error al transferir: " + err.message);
      toast.dismiss(tid);
    }
  };

  const pendingVotesCount = groups.reduce((acc, g) => {
    const txs = (g.pending || []).filter(p => !readVotes.includes(`tx-${p.id}`)).length;
    const limits = (g.pendingLimitProposals || []).filter(p => !readVotes.includes(`lim-${p.id}`)).length;
    const deletes = (g.deleteProposals || []).filter(p => p.status === "pending" && !readVotes.includes(`del-${p.id}`)).length;
    return acc + txs + limits + deletes;
  }, 0);

  return (
    <div className="app-container">
      <div className="main-content">
        {activeTab === "inicio" && (
          <InicioTab 
            groups={groups} 
            activeGroupId={activeGroupId} 
            userId={localStorage.getItem("monad_dbUserId") || ""}
            onSelectGroup={setActiveGroupId}
            onGroupClick={(id) => { setActiveGroupId(id); setForceGlobal(false); setActiveTab("movimientos"); }}
            onNewGroup={() => setSheetView("new_group")}
            onDeposit={() => setSheetView("deposit")}
            onSpend={() => setSheetView("spend")}
            onProposeLimit={() => setSheetView("propose_limit")}
            onDeleteGroup={handleDeleteGroup}
            onRenameGroup={handleRenameGroup}
            onChangeAdminLeave={handleChangeAdminLeave}
              onCancelDeleteProposal={handleCancelDeleteProposal}
                        isLoadingDetails={isLoadingDetails}
          />
        )}
        {activeTab === "movimientos" && (
          <MovimientosTab 
            groups={groups} 
            initialGroupId={forceGlobal ? undefined : (activeGroupId || undefined)} 
          />
        )}
        {activeTab === "unirse" && (
          <UnirseTab onJoinInit={handleJoinInit} />
        )}
        {activeTab === "aprobaciones" && (
          <AprobacionesTab 
            group={activeGroup} 
            userAddress={user?.wallet?.address || ""} 
            readVotes={readVotes}
            onApprove={handleApprove}
            onReject={handleReject}
            onApproveLimit={handleApproveLimit}
            onRejectLimit={handleRejectLimit}
            onApproveDelete={handleApproveDelete}
            onRejectDelete={handleRejectDelete}
          />
        )}
        {activeTab === "perfil" && (
          <MiCuentaTab 
            userAddress={user?.wallet?.address || ""} 
            userEmail={user?.google?.email || user?.email?.address || ""}
            stats={userStats} 
            groups={groups}
            readVotes={readVotes}
            notificationsHistory={notificationsHistory}
            onMarkAsRead={async (ids) => {
              const newRead = [...new Set([...readVotes, ...ids])];
              setReadVotes(newRead);
              localStorage.setItem("monad_read_votes", JSON.stringify(newRead));
              toast.success("Notificaciones marcadas como leídas");
              
              // Also mark DB notifications as read
              const unreadDbIds = notificationsHistory.filter(n => !n.read).map(n => n.id);
              if (unreadDbIds.length > 0) {
                try {
                  const token = await getAccessToken();
                  if (token) await api.markNotificationsRead(token, unreadDbIds);
                  setNotificationsHistory(prev => prev.map(n => ({...n, read: true})));
                } catch(e) {
                  console.error(e);
                }
              }
            }}
            onEditName={async (newName) => {
              try {
                const token = await getAccessToken();
                if (token) await api.updateProfile(token, newName);
              } catch (e) {
                console.error("Error updating profile", e);
              }
            }}
            onNavigateToVote={(groupId) => {
              setActiveGroupId(groupId);
              setActiveTab("aprobaciones");
            }}
            onNavigateToGroup={(groupId) => {
              setActiveGroupId(groupId);
              setActiveTab("inicio");
            }}
            onLogout={logout} 
          />
        )}
      </div>

      <BottomNav active={activeTab} pendingCount={pendingVotesCount} onChange={(tab) => { setActiveTab(tab); if (tab === "movimientos") setForceGlobal(true); }} />

      <Sheet isOpen={!!sheetView} onClose={() => { setSheetView(null); setJoinGroupData(undefined); }} title={
        sheetView === "new_group" ? "Crear Nuevo Grupo" : 
        sheetView === "deposit" ? "Ingresar Dinero" : 
        sheetView === "join_group" ? "Unirse al Grupo" : 
        sheetView === "propose_limit" ? "Proponer Nuevo Límite" : "Solicitar Gasto"
      }>
        <GroupForms 
          type={sheetView!} 
          group={sheetView === "join_group" ? joinGroupData : activeGroup} 
          onSuccess={() => { 
            setSheetView(null); 
            setJoinGroupData(undefined); 
            if (sheetView === "new_group" || sheetView === "join_group") {
              // Pequeño delay para que el RPC de Monad asimile la creación
              setTimeout(() => loadBasicData(), 1500);
            } else if (activeGroup) {
              fetchGroupDetails(activeGroup.id, 1500);
            } else {
              setTimeout(() => loadBasicData(), 1500);
            }
          }} 
          onCancel={() => { setSheetView(null); setJoinGroupData(undefined); }} 
        />
      </Sheet>
    </div>
  );
}


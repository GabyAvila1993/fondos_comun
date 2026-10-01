import { useState, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { api } from "../lib/api";
import { signTyped } from "../lib/eip712";
import toast from "react-hot-toast";
import type { Group, UserStats } from "../types";

// Componentes
import BottomNav, { Tab } from "./BottomNav";
import InicioTab from "./tabs/InicioTab";
import MovimientosTab from "./tabs/MovimientosTab";
import AprobacionesTab from "./tabs/AprobacionesTab";
import UnirseTab from "./tabs/UnirseTab";
import MiCuentaTab from "./tabs/MiCuentaTab";
import Sheet from "./Sheet";
import GroupForms from "./GroupForms";

export default function UserDashboard() {
  const { user, getAccessToken, logout } = usePrivy();
  const { wallets } = useWallets();
  const [activeTab, setActiveTab] = useState<Tab>("inicio");
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string>("");
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [forceGlobal, setForceGlobal] = useState(false);

  // UI State
  const [sheetView, setSheetView] = useState<"new_group" | "deposit" | "spend" | "join_group" | "propose_limit" | null>(null);
  const [joinGroupData, setJoinGroupData] = useState<Group | undefined>(undefined);

  useEffect(() => {
    if (user) {
      loadData();
    }
    
    const handleRefresh = () => {
      loadData();
    };
    window.addEventListener("group_deleted_refresh", handleRefresh);
    return () => {
      window.removeEventListener("group_deleted_refresh", handleRefresh);
    };
  }, [user]);

  const loadData = async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      const basicGroups = await api.listGroups(token);
      
      // Fetch full state for each group (balance, txs, pending, etc)
      const fullGroups = await Promise.all(
        basicGroups.map(async (g) => {
          try {
            const full = await api.getGroup(token, g.id);
            return { ...g, ...full, isCreator: g.isCreator };
          } catch {
            return g;
          }
        })
      );
      
      setGroups(fullGroups);
      if (fullGroups.length > 0 && !activeGroupId) {
        setActiveGroupId(fullGroups[0].id);
      }

      try {
        const statsData = await api.getMyStats(token);
        const totalDeposited = statsData.reduce((acc, curr) => acc + curr.amountDeposited, 0);
        setUserStats({
          totalDeposited: String(totalDeposited),
          groupsCount: statsData.length
        });
      } catch (e) {
        console.warn("Could not load user stats", e);
      }

      // Check for ?join=ID in URL
      const searchParams = new URLSearchParams(window.location.search);
      const joinId = searchParams.get("join");
      if (joinId) {
        // Remove it from URL so it doesn't trigger again on reload
        window.history.replaceState({}, document.title, "/");
        
        // Let's check if the user is already in this group
        const existing = fullGroups.find(g => g.id === joinId);
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

      const tid = toast.loading("Aprobando gasto...");
      const start = Date.now();
      await api.vote(token, activeGroup.id, {
        txId,
        approve: true,
        nonce,
        signature
      });
      const end = Date.now();

      toast.success(`¡Gasto aprobado en ${(end-start)/1000}s! ⚡️`, { id: tid });
      loadData();
    } catch (err: any) {
      toast.error("Error al aprobar: " + err.message);
      toast.dismiss();
    }
  };

  const handleReject = async (txId: number) => {
    if (!activeGroup) return;
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

      const tid = toast.loading("Rechazando gasto...");
      const start = Date.now();
      await api.vote(token, activeGroup.id, {
        txId,
        approve: false,
        nonce,
        signature
      });
      const end = Date.now();

      toast.success(`¡Gasto rechazado en ${(end-start)/1000}s! ⚡️`, { id: tid });
      loadData();
    } catch (err: any) {
      toast.error("Error al rechazar: " + err.message);
      toast.dismiss();
    }
  };

  const handleApproveLimit = async (proposalId: number) => {
    if (!activeGroup) return;
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

      const tid = toast.loading("Aprobando cambio de límite...");
      const start = Date.now();
      await api.voteLimitChange(token, activeGroup.id, {
        proposalId,
        approve: true,
        nonce,
        signature
      });
      const end = Date.now();

      toast.success(`¡Cambio de límite aprobado en ${(end-start)/1000}s! ⚡️`, { id: tid });
      loadData();
    } catch (err: any) {
      toast.error("Error al aprobar: " + err.message);
      toast.dismiss();
    }
  };

  const handleRejectLimit = async (proposalId: number) => {
    if (!activeGroup) return;
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

      const tid = toast.loading("Rechazando cambio de límite...");
      const start = Date.now();
      await api.voteLimitChange(token, activeGroup.id, {
        proposalId,
        approve: false,
        nonce,
        signature
      });
      const end = Date.now();

      toast.success(`¡Cambio de límite rechazado en ${(end-start)/1000}s! ⚡️`, { id: tid });
      loadData();
    } catch (err: any) {
      toast.error("Error al rechazar: " + err.message);
      toast.dismiss();
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      const tid = toast.loading("Eliminando grupo...");
      await api.deleteGroup(token, groupId);
      toast.success("Grupo eliminado", { id: tid });
      if (activeGroupId === groupId) setActiveGroupId("");
      loadData();
    } catch (err: any) {
      toast.error("Error al eliminar: " + err.message);
    }
  };

  return (
    <div className="app-container">
      <div className="main-content">
        {activeTab === "inicio" && (
          <InicioTab 
            groups={groups} 
            activeGroupId={activeGroupId} 
            userId={user?.id}
            onSelectGroup={setActiveGroupId}
            onGroupClick={(id) => { setActiveGroupId(id); setForceGlobal(false); setActiveTab("movimientos"); }}
            onNewGroup={() => setSheetView("new_group")}
            onDeposit={() => setSheetView("deposit")}
            onSpend={() => setSheetView("spend")}
            onProposeLimit={() => setSheetView("propose_limit")}
            onDeleteGroup={handleDeleteGroup}
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
            onApprove={handleApprove}
            onReject={handleReject}
            onApproveLimit={handleApproveLimit}
            onRejectLimit={handleRejectLimit}
          />
        )}
        {activeTab === "perfil" && (
          <MiCuentaTab 
            userAddress={user?.wallet?.address || ""} 
            userEmail={user?.google?.email || user?.email?.address || ""}
            stats={userStats} 
            onLogout={logout} 
          />
        )}
      </div>

      <BottomNav active={activeTab} onChange={(tab) => { setActiveTab(tab); if (tab === "movimientos") setForceGlobal(true); }} />

      <Sheet isOpen={!!sheetView} onClose={() => { setSheetView(null); setJoinGroupData(undefined); }} title={
        sheetView === "new_group" ? "Crear Nuevo Grupo" : 
        sheetView === "deposit" ? "Ingresar Dinero" : 
        sheetView === "join_group" ? "Unirse al Grupo" : 
        sheetView === "propose_limit" ? "Proponer Nuevo Límite" : "Solicitar Gasto"
      }>
        <GroupForms 
          type={sheetView!} 
          group={sheetView === "join_group" ? joinGroupData : activeGroup} 
          onSuccess={() => { setSheetView(null); setJoinGroupData(undefined); loadData(); }} 
          onCancel={() => { setSheetView(null); setJoinGroupData(undefined); }} 
        />
      </Sheet>
    </div>
  );
}

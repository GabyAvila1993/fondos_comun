import { useState, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { api } from "../lib/api";
import { signTyped } from "../lib/eip712";
import type { Group, UserStats } from "../types";

// Componentes
import BottomNav, { Tab } from "./BottomNav";
import InicioTab from "./tabs/InicioTab";
import MovimientosTab from "./tabs/MovimientosTab";
import AprobacionesTab from "./tabs/AprobacionesTab";
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
  const [sheetView, setSheetView] = useState<"new_group" | "deposit" | "spend" | "join_group" | null>(null);
  const [joinGroupData, setJoinGroupData] = useState<Group | undefined>(undefined);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      const basicGroups = await api.listGroups(token);
      
      // Fetch full state for each group (balance, txs, pending, etc)
      const fullGroups = await Promise.all(
        basicGroups.map((g) => api.getGroup(token, g.id).catch(() => g))
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
          alert("Ya eres miembro de este grupo.");
          setActiveGroupId(existing.id);
        } else {
          // Fetch group info from backend
          try {
            const joinGroup = await api.getGroup(token, joinId);
            setJoinGroupData(joinGroup);
            setSheetView("join_group");
          } catch (err) {
            alert("No se pudo cargar el grupo al que te invitaron.");
          }
        }
      }
    } catch (e) {
      console.error("Error loading data", e);
    }
  };

  const activeGroup = groups.find((g) => g.id === activeGroupId);

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

      await api.vote(token, activeGroup.id, {
        txId,
        approve: true,
        nonce,
        signature
      });

      alert("¡Voto registrado con éxito!");
      loadData();
    } catch (err: any) {
      alert("Error al aprobar: " + err.message);
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

      await api.vote(token, activeGroup.id, {
        txId,
        approve: false,
        nonce,
        signature
      });

      alert("¡Voto de rechazo registrado con éxito!");
      loadData();
    } catch (err: any) {
      alert("Error al rechazar: " + err.message);
    }
  };

  return (
    <div className="app-container">
      <div className="main-content">
        {activeTab === "inicio" && (
          <InicioTab 
            groups={groups} 
            activeGroupId={activeGroupId} 
            onSelectGroup={setActiveGroupId}
            onGroupClick={(id) => { setActiveGroupId(id); setForceGlobal(false); setActiveTab("movimientos"); }}
            onNewGroup={() => setSheetView("new_group")}
            onDeposit={() => setSheetView("deposit")}
            onSpend={() => setSheetView("spend")}
          />
        )}
        {activeTab === "movimientos" && (
          <MovimientosTab 
            groups={groups} 
            initialGroupId={forceGlobal ? null : activeGroupId} 
          />
        )}
        {activeTab === "aprobaciones" && (
          <AprobacionesTab 
            group={activeGroup} 
            userAddress={user?.wallet?.address || ""} 
            onApprove={handleApprove}
            onReject={handleReject}
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
        sheetView === "join_group" ? "Unirse al Grupo" : "Solicitar Gasto"
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

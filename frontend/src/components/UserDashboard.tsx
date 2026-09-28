import { useEffect, useMemo, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { api } from "../lib/api";
import { signTyped, toWei } from "../lib/eip712";
import type { Group } from "../types";
import Sheet from "./Sheet";
import PendingApprovals from "./PendingApprovals";
import TransactionFeed from "./TransactionFeed";
import GroupDetail from "./GroupDetail";
import { DepositForm, SpendForm, NewGroupForm } from "./GroupForms";

/**
 * UserDashboard
 * --------------
 * Dashboard del usuario con menú lateral (adaptado a mobile con un
 * hamburguesa que abre/cierra el panel) y tres secciones: sus grupos,
 * estadísticas de aportes, y configuración simple (cambiar nombre).
 *
 * Este archivo es SOLO estructura/lógica en React — no trae CSS. Los
 * nombres de clase (dash-*) están pensados para que les sumes tus propios
 * estilos, reusando las variables que ya definiste en app.css (--gold,
 * --card, --border, etc.) donde tenga sentido.
 */

type Tab = "resumen" | "grupos" | "estadisticas" | "configuracion";
type SheetType = "deposit" | "spend" | "request" | "newGroup" | null;
type View = "dashboard" | "groupDetail";

interface GroupStat {
  groupName: string;
  amountDeposited: number;
}

const MON_TO_FIAT_RATE = 0.001;

const fmtFiatFromMon = (monAmount: number) => {
  const fiatAmount = Number(monAmount) / MON_TO_FIAT_RATE;
  return "$" + Math.round(fiatAmount).toLocaleString("es-AR");
};

export default function UserDashboard() {
  const { user, logout, getAccessToken } = usePrivy();
  const { wallets } = useWallets();
  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");

  const [activeTab, setActiveTab] = useState<Tab>("resumen");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGroupId, setActiveGroupId] = useState<string>("");
  const [sheet, setSheet] = useState<SheetType>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [selectedGroupForDetail, setSelectedGroupForDetail] = useState<Group | null>(null);

  const [displayName, setDisplayName] = useState(user?.google?.name || user?.email?.address || "");
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  const activeGroup = groups.find((g) => g.id === activeGroupId);

  useEffect(() => {
    (async () => {
      try {
        const token = await getAccessToken();
        const list = await api.listGroups(token!);
        setGroups(list);
        if (list.length && !activeGroupId) setActiveGroupId(list[0].id);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function refreshActiveGroup() {
    if (!activeGroupId) return;
    const token = await getAccessToken();
    const full = await api.getGroup(token!, activeGroupId);
    setGroups((prev) => prev.map((g) => (g.id === activeGroupId ? full : g)));
  }

  useEffect(() => {
    refreshActiveGroup();
    const interval = setInterval(refreshActiveGroup, 5000);
    return () => clearInterval(interval);
  }, [activeGroupId]);

  // TODO backend: reemplazar esto por datos reales. Hoy no existe un
  // endpoint que devuelva "cuánto depositó ESTE usuario en cada grupo" —
  // el contrato emite el evento Deposit, pero nadie lo está agregando
  // todavía. La forma más simple de resolverlo: que el RelayerService
  // escuche ese evento (o lo lea con contract.queryFilter) y lo guarde en
  // una tabla `deposits` en Postgres, y exponer GET /users/me/stats.
  // Mientras tanto, usamos el balance actual de cada grupo como aproximación.
  const stats: GroupStat[] = useMemo(
    () => groups.map((g) => ({ groupName: g.name, amountDeposited: Number(g.balance || 0) })),
    [groups],
  );
  const maxStat = Math.max(1, ...stats.map((s) => s.amountDeposited));

  const totalBalance = groups.reduce((sum, g) => sum + Number(g.balance || 0), 0);
  const totalPending = groups.reduce((sum, g) => sum + (g.pending?.length || 0), 0);

  const initials = (displayName || "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleSaveName() {
    setSavingName(true);
    setNameSaved(false);
    try {
      // TODO backend: hoy no existe PATCH /users/me. Hay que agregar ese
      // endpoint en UsersController (actualiza la columna `name` de User)
      // y llamarlo acá, por ejemplo: await api.updateProfile(token, { name: displayName })
      await new Promise((r) => setTimeout(r, 400)); // simulado
      setNameSaved(true);
    } finally {
      setSavingName(false);
    }
  }

  async function withSignature<T>(
    primaryType: "RequestExpense" | "Vote" | "Join",
    message: Record<string, any>,
    action: (nonce: string, signature: string) => Promise<T>,
  ) {
    if (!embeddedWallet || !activeGroup) throw new Error("Wallet o grupo no listos");
    const token = await getAccessToken();
    const { nonce } = await api.getNonce(token!, activeGroup.id);
    const signature = await signTyped(embeddedWallet as any, primaryType, activeGroup.contractAddress, {
      ...message,
      nonce,
    });
    return action(nonce, signature);
  }

  async function handleDeposit(fiatAmount: number) {
    if (isSubmitting) return;
    if (!activeGroup) {
      setError("Selecciona un grupo primero");
      return;
    }
    if (fiatAmount <= 0) {
      setError("El monto debe ser mayor a 0");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const token = await getAccessToken();
      await api.deposit(token!, activeGroup.id, fiatAmount);
      setSheet(null);
      setSuccessMessage("¡Dinero ingresado exitosamente!");
      setTimeout(() => setSuccessMessage(""), 3000);
      refreshActiveGroup();
    } catch (e: any) {
      setError(e.message || "Error al ingresar dinero");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSpend(amount: number, desc: string, forceApproval: boolean) {
    if (isSubmitting) return;
    if (!activeGroup) {
      setError("Selecciona un grupo primero");
      return;
    }
    if (amount <= 0) {
      setError("El monto debe ser mayor a 0");
      return;
    }
    if (!desc.trim()) {
      setError("La descripción es requerida");
      return;
    }

    const amountMon = amount / 1000;

    setIsSubmitting(true);
    setError("");
    try {
      const token = await getAccessToken();
      await withSignature(
        "RequestExpense",
        { user: embeddedWallet!.address, amount: toWei(amountMon.toString()), desc, forceApproval },
        (nonce, signature) =>
          api.requestExpense(token!, activeGroup.id, { amountMon: amountMon.toString(), desc, forceApproval, nonce, signature }),
      );
      setSheet(null);
      setSuccessMessage(forceApproval ? "¡Solicitud enviada!" : "¡Gasto registrado!");
      setTimeout(() => setSuccessMessage(""), 3000);
      refreshActiveGroup();
    } catch (e: any) {
      setError(e.message || "Error al registrar el gasto");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVote(txId: number, approve: boolean) {
    if (isSubmitting) return;
    if (!activeGroup) {
      setError("Selecciona un grupo primero");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const token = await getAccessToken();
      await withSignature("Vote", { voter: embeddedWallet!.address, txId, approve }, (nonce, signature) =>
        api.vote(token!, activeGroup.id, { txId, approve, nonce, signature }),
      );
      setSuccessMessage(approve ? "¡Voto registrado!" : "¡Voto rechazado!");
      setTimeout(() => setSuccessMessage(""), 3000);
      refreshActiveGroup();
    } catch (e: any) {
      setError(e.message || "Error al registrar voto");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleNewGroup(name: string, creditLimit: string) {
    if (isSubmitting) return;
    if (!name.trim()) {
      setError("El nombre del grupo es requerido");
      return;
    }
    if (Number(creditLimit) <= 0) {
      setError("El límite debe ser mayor a 0");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const token = await getAccessToken();
      const g = await api.createGroup(token!, { name, creditLimit, dailyLimit: 2 });
      setSheet(null);
      setActiveGroupId(g.id);
      setSuccessMessage("¡Grupo creado exitosamente!");
      setTimeout(() => setSuccessMessage(""), 3000);
      const list = await api.listGroups(token!);
      setGroups(list);
    } catch (e: any) {
      setError(e.message || "Error al crear grupo");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleGroupDetail(group: Group) {
    setSelectedGroupForDetail(group);
    setActiveGroupId(group.id);
    setCurrentView("groupDetail");
  }

  function handleBackToDashboard() {
    setCurrentView("dashboard");
    setSelectedGroupForDetail(null);
  }

  function handleGroupChangeFromDetail(groupId: string) {
    setActiveGroupId(groupId);
    const updatedGroup = groups.find(g => g.id === groupId);
    if (updatedGroup) {
      setSelectedGroupForDetail(updatedGroup);
    }
  }

  function NavItem({ tab, label, icon }: { tab: Tab; label: string; icon: string }) {
    return (
      <div
        className={`dash-nav-item ${activeTab === tab ? "dash-nav-item-active" : ""}`}
        onClick={() => {
          setCurrentView("dashboard");
          setActiveTab(tab);
          setSidebarOpen(false); // en mobile, al elegir una sección se cierra el panel
        }}
      >
        <span className="dash-nav-icon">{icon}</span>
        <span className="dash-nav-label">{label}</span>
      </div>
    );
  }

  return (
    <div className="dash-layout">
      {/* Botón hamburguesa — solo debería verse en mobile (eso lo resuelve tu CSS con @media) */}
      <button className="dash-mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? "✕" : "☰"}
      </button>

      {/* Fondo oscuro detrás del panel cuando está abierto en mobile */}
      {sidebarOpen && <div className="dash-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`dash-sidebar ${sidebarOpen ? "dash-sidebar-open" : ""}`}>
        <div className="dash-sidebar-header">
          <div className="dash-avatar">{initials}</div>
          <div>
            <div className="dash-user-name">{displayName || "Usuario"}</div>
            <div className="dash-user-email">{user?.email?.address}</div>
          </div>
        </div>

        <nav className="dash-nav">
          <NavItem tab="resumen" label="Resumen" icon="🏠" />
          <NavItem tab="grupos" label="Mis grupos" icon="👥" />
          <NavItem tab="estadisticas" label="Estadísticas" icon="📊" />
          <NavItem tab="configuracion" label="Configuración" icon="⚙️" />
        </nav>

        <div className="dash-sidebar-footer">
          <button className="dash-logout-btn" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="dash-content">
        {loading && <p className="dash-hint">Cargando tus datos...</p>}

        {!loading && currentView === "dashboard" && (
          <>
            {/* Success Message */}
            {successMessage && (
              <div className="dash-success-message">
                <span className="dash-success-icon">✓</span>
                <span>{successMessage}</span>
              </div>
            )}

            {/* Acciones rápidas premium - solo si hay grupos */}
            {groups.length > 0 && (
              <div className="dash-quick-actions">
                <button
                  className="dash-action-btn dash-action-new-group"
                  onClick={() => setSheet("newGroup")}
                  title="Crear nuevo grupo"
                >
                  <span className="dash-action-icon">👥</span>
                  <span className="dash-action-label">Nuevo grupo</span>
                </button>
              </div>
            )}

            {/* Mensaje cuando no hay grupos */}
            {groups.length === 0 && (
              <div className="dash-empty-state-premium">
                <div className="dash-empty-icon">🚀</div>
                <h2 className="dash-section-title">¡Bienvenido a Fondo Común!</h2>
                <p className="dash-hint">Crea tu primer grupo para comenzar a gestionar tus finanzas compartidas de forma segura y transparente.</p>
                <button className="btn btn-gold dash-cta-button" onClick={() => setSheet("newGroup")}>
                  <span className="dash-cta-icon">✨</span>
                  <span>Crear mi primer grupo</span>
                </button>
              </div>
            )}

            {activeTab === "resumen" && (
              <ResumenTab totalBalance={totalBalance} totalGroups={groups.length} totalPending={totalPending} />
            )}

            {activeTab === "grupos" && <GruposTab groups={groups} activeGroupId={activeGroupId} onSelectGroup={setActiveGroupId} onOpenNewGroupSheet={() => setSheet("newGroup")} onGroupDetail={handleGroupDetail} />}

            {activeTab === "estadisticas" && <EstadisticasTab stats={stats} maxStat={maxStat} />}

            {activeTab === "configuracion" && (
              <ConfiguracionTab
                displayName={displayName}
                setDisplayName={setDisplayName}
                onSave={handleSaveName}
                saving={savingName}
                saved={nameSaved}
              />
            )}

            {/* Sheets para acciones */}
            <Sheet open={sheet === "deposit"} onClose={() => setSheet(null)}>
              <DepositForm onSubmit={handleDeposit} error={error} isSubmitting={isSubmitting} />
            </Sheet>
            <Sheet open={sheet === "spend"} onClose={() => setSheet(null)}>
              <SpendForm creditLimit={activeGroup ? Number(activeGroup.creditLimit) : Infinity} error={error} isSubmitting={isSubmitting} onSubmit={(a, d) => handleSpend(a, d, false)} />
            </Sheet>
            <Sheet open={sheet === "request"} onClose={() => setSheet(null)}>
              <SpendForm creditLimit={Infinity} error={error} isSubmitting={isSubmitting} danger onSubmit={(a, d) => handleSpend(a, d, true)} />
            </Sheet>
            <Sheet open={sheet === "newGroup"} onClose={() => setSheet(null)}>
              <NewGroupForm onSubmit={handleNewGroup} error={error} isSubmitting={isSubmitting} />
            </Sheet>
          </>
        )}

        {!loading && currentView === "groupDetail" && selectedGroupForDetail && (
          <GroupDetail
            group={selectedGroupForDetail}
            groups={groups}
            onBack={handleBackToDashboard}
            onGroupChange={handleGroupChangeFromDetail}
            sheet={sheet}
            setSheet={setSheet}
            error={error}
            isSubmitting={isSubmitting}
            successMessage={successMessage}
            onDeposit={handleDeposit}
            onSpend={handleSpend}
            onVote={handleVote}
            onNewGroup={handleNewGroup}
          />
        )}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------
// Resumen: lo primero que ve el usuario al entrar. Una foto general de
// todos sus grupos junta, no de uno solo.
// ---------------------------------------------------------------------
function ResumenTab({
  totalBalance,
  totalGroups,
  totalPending,
}: {
  totalBalance: number;
  totalGroups: number;
  totalPending: number;
}) {
  const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");
  return (
    <div>
      <h2 className="dash-section-title">Resumen general</h2>
      <div className="dash-summary-row">
        <div className="dash-summary-card">
          <div className="dash-summary-value">{fmtFiatFromMon(totalBalance)}</div>
          <div className="dash-summary-label">Fondo total (todos tus grupos)</div>
        </div>
        <div className="dash-summary-card">
          <div className="dash-summary-value">{totalGroups}</div>
          <div className="dash-summary-label">Grupos activos</div>
        </div>
        <div className="dash-summary-card">
          <div className="dash-summary-value">{totalPending}</div>
          <div className="dash-summary-label">Solicitudes esperando tu voto</div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Mis grupos: la lista completa, no solo el que tenés seleccionado.
// ---------------------------------------------------------------------
function GruposTab({ groups, activeGroupId, onSelectGroup, onOpenNewGroupSheet, onGroupDetail }: { groups: Group[]; activeGroupId: string; onSelectGroup: (id: string) => void; onOpenNewGroupSheet: () => void; onGroupDetail: (group: Group) => void }) {
  const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

  if (groups.length === 0) {
    return (
      <div className="dash-empty-state-premium">
        <div className="dash-empty-icon">👥</div>
        <h2 className="dash-section-title">¡Crea tu primer grupo!</h2>
        <p className="dash-hint">Comienza a gestionar tus finanzas compartidas creando un grupo para viajes, comidas o gastos en común.</p>
        <button className="btn btn-gold dash-cta-button" onClick={onOpenNewGroupSheet}>
          <span className="dash-cta-icon">✨</span>
          <span>Crear grupo ahora</span>
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="dash-section-title">Mis grupos</h2>
      <div className="dash-group-list">
        {groups.map((g) => (
          <div
            className={`dash-group-card ${g.id === activeGroupId ? "dash-group-card-active" : ""}`}
            key={g.id}
            onClick={() => onGroupDetail(g)}
          >
            <div className="dash-group-card-main">
              <div className="dash-group-card-name">{g.name}</div>
            </div>
            <div className="dash-group-card-balance">{fmtFiatFromMon(Number(g.balance || 0))}</div>
            <div className="dash-group-card-action">
              <span className="dash-group-card-action-text">Ver detalles →</span>
            </div>
          </div>
        ))}
      </div>

      {/* Grupo activo detalle - Eliminado, ahora usa GroupDetail */}
    </div>
  );
}

// ---------------------------------------------------------------------
// Estadísticas: un grafico de barras simple hecho con SVG (no depende de
// ninguna libreria ni de CSS para dibujarse, solo geometria).
// ---------------------------------------------------------------------
function EstadisticasTab({ stats, maxStat }: { stats: GroupStat[]; maxStat: number }) {
  const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");
  const barHeight = 28;
  const gap = 14;
  const chartWidth = 500; // Aumentado para dar espacio al texto
  const maxBarWidth = chartWidth - 140 - 100; // 140 para label, 100 para texto

  if (stats.length === 0) {
    return <p className="dash-hint">Todavía no hay datos suficientes para mostrar estadísticas.</p>;
  }

  return (
    <div>
      <h2 className="dash-section-title">En qué grupos pusiste más plata</h2>
      <svg
        className="dash-chart"
        viewBox={`0 0 ${chartWidth} ${stats.length * (barHeight + gap)}`}
        width="100%"
      >
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00D8C0" />
            <stop offset="100%" stopColor="#FFD700" />
          </linearGradient>
        </defs>
        {stats.map((s, i) => {
          const barWidth = maxStat === 0 ? 0 : (s.amountDeposited / maxStat) * maxBarWidth;
          const y = i * (barHeight + gap);
          return (
            <g key={s.groupName}>
              <text x={0} y={y + barHeight / 2 + 4} className="dash-chart-label">
                {s.groupName}
              </text>
              <rect x={140} y={y} width={Math.max(barWidth, 2)} height={barHeight} rx={6} className="dash-chart-bar" />
              <text x={140 + barWidth + 10} y={y + barHeight / 2 + 4} className="dash-chart-value">
                {fmtFiatFromMon(s.amountDeposited)}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="dash-hint dash-chart-note">
        Por ahora este número muestra el fondo actual del grupo, no el total histórico que depositaste — falta un
        endpoint en el backend que sume tus depósitos reales (ver comentario en el código).
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------
// Configuración: por ahora solo el cambio de nombre, como pediste.
// ---------------------------------------------------------------------
function ConfiguracionTab({
  displayName,
  setDisplayName,
  onSave,
  saving,
  saved,
}: {
  displayName: string;
  setDisplayName: (v: string) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
  return (
    <div>
      <h2 className="dash-section-title">Configuración</h2>
      <div className="dash-settings-card">
        <label className="dash-label">Nombre para mostrar</label>
        <input
          className="dash-input"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Tu nombre"
        />
        <button className="btn btn-gold" onClick={onSave} disabled={saving}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
        {saved && <p className="dash-hint dash-saved-msg">Guardado ✓</p>}
      </div>
    </div>
  );
}


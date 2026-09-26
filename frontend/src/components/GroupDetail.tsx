import { usePrivy } from "@privy-io/react-auth";
import type { Group } from "../types";
import TransactionFeed from "./TransactionFeed";
import PendingApprovals from "./PendingApprovals";
import Sheet from "./Sheet";
import { DepositForm, SpendForm, NewGroupForm } from "./GroupForms";

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

export type SheetType = "deposit" | "spend" | "request" | "newGroup" | null;

interface GroupDetailProps {
  group: Group;
  groups: Group[];
  onBack: () => void;
  onGroupChange: (groupId: string) => void;
  sheet: SheetType;
  setSheet: (sheet: SheetType) => void;
  error: string;
  isSubmitting: boolean;
  successMessage: string;
  onDeposit: (fiatAmount: number) => void;
  onSpend: (amount: number, desc: string, forceApproval: boolean) => void;
  onVote: (txId: number, approve: boolean) => void;
  onNewGroup: (name: string, creditLimit: string) => void;
}

export default function GroupDetail({
  group,
  groups,
  onBack,
  onGroupChange,
  sheet,
  setSheet,
  error,
  isSubmitting,
  successMessage,
  onDeposit,
  onSpend,
  onVote,
  onNewGroup,
}: GroupDetailProps) {
  const { user } = usePrivy();
  const active = groups.find((g) => g.id === group.id) || group;
  const majority = active.majorityNeeded || 2;
  const todayCount = 0;

  return (
    <div className="group-detail-layout">
      {/* Breadcrumb Premium */}
      <div className="group-detail-breadcrumb">
        <button className="breadcrumb-back" onClick={onBack}>
          <span className="breadcrumb-icon">←</span>
          <span>Volver a mis grupos</span>
        </button>
        <div className="breadcrumb-separator">/</div>
        <div className="breadcrumb-current">{active.name}</div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="dash-success-message">
          <span className="dash-success-icon">✓</span>
          <span>{successMessage}</span>
        </div>
      )}

      {/* User Greeting */}
      <div className="group-detail-greeting">
        <div className="greet">
          Hola, <strong>{user?.google?.name || user?.email?.address || "vos"}</strong>
        </div>
      </div>

      {/* Balance Hero Premium */}
      <div className="hero">
        <div className="label">FONDO DISPONIBLE</div>
        <div className="amount">{fmt(Number(active.balance || 0))}</div>
        <div className="group-tabs">
          {groups.map((g) => (
            <div
              key={g.id}
              className={`group-tab ${g.id === active.id ? "active" : ""}`}
              onClick={() => onGroupChange(g.id)}
            >
              {g.name}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons Premium */}
      <div className="actions">
        <div className="action primary" onClick={() => setSheet("deposit")}>
          <div className="circle">＋</div><span className="lbl">Ingresar</span>
        </div>
        <div className="action" onClick={() => setSheet("spend")}>
          <div className="circle">🛒</div><span className="lbl">Gastar</span>
        </div>
        <div className="action" onClick={() => setSheet("request")}>
          <div className="circle">⚡</div><span className="lbl">Pedir más</span>
        </div>
        <div className="action" onClick={() => setSheet("newGroup")}>
          <div className="circle">👥</div><span className="lbl">Nuevo grupo</span>
        </div>
      </div>

      {/* Quota Strip Premium */}
      <div className="quota-strip">
        <div className="quota-mini"><div className="v">{fmt(Number(active.creditLimit))}</div><div className="l">MÁX. POR GASTO</div></div>
        <div className="quota-mini"><div className="v">{todayCount}/{active.dailyLimit}</div><div className="l">USADAS HOY</div></div>
        <div className="quota-mini"><div className="v">{majority} votos</div><div className="l">PARA APROBAR</div></div>
      </div>

      {/* Grid Layout */}
      <div className="dashboard-grid">
        <div className="pending-section">
          <PendingApprovals pending={active.pending || []} majorityNeeded={majority} onVote={onVote} />
        </div>
        <div className="transactions-section">
          <div className="section-title">Movimientos</div>
          <TransactionFeed transactions={(active.transactions || []).filter((t) => t.executed)} />
        </div>
      </div>

      {/* Sheets */}
      <Sheet open={sheet === "deposit"} onClose={() => setSheet(null)}>
        <DepositForm onSubmit={onDeposit} error={error} isSubmitting={isSubmitting} />
      </Sheet>
      <Sheet open={sheet === "spend"} onClose={() => setSheet(null)}>
        <SpendForm creditLimit={Number(active.creditLimit)} error={error} isSubmitting={isSubmitting} onSubmit={(a, d) => onSpend(a, d, false)} />
      </Sheet>
      <Sheet open={sheet === "request"} onClose={() => setSheet(null)}>
        <SpendForm creditLimit={Infinity} error={error} isSubmitting={isSubmitting} danger onSubmit={(a, d) => onSpend(a, d, true)} />
      </Sheet>
      <Sheet open={sheet === "newGroup"} onClose={() => setSheet(null)}>
        <NewGroupForm onSubmit={onNewGroup} error={error} isSubmitting={isSubmitting} />
      </Sheet>
    </div>
  );
}

import { useState, useEffect } from "react";
import type { UserStats } from "../../types";
import { User, Bell, IdentificationCard, CreditCard, Password, ChatCircle, CaretRight, PencilSimple } from "@phosphor-icons/react";

interface MiCuentaTabProps {
  userAddress: string;
  userEmail: string;
  stats: UserStats | null;
  onLogout: () => void;
}

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

export default function MiCuentaTab({ userAddress, userEmail, stats, onLogout }: MiCuentaTabProps) {
  const defaultName = userEmail ? userEmail.split('@')[0] : "Usuario Monad";
  const [userName, setUserName] = useState(() => localStorage.getItem("monad_username") || defaultName);

  const handleEditName = () => {
    const newName = prompt("Ingresa tu nuevo nombre de usuario:", userName);
    if (newName && newName.trim()) {
      setUserName(newName.trim());
      localStorage.setItem("monad_username", newName.trim());
    }
  };

  // Use real stats or fallback to 0
  const totalDeposited = stats?.totalDeposited ? Number(stats.totalDeposited) * 1000 : 0;
  const groupsCount = stats?.groupsCount || 0;
  
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
            <div className="settings-item" onClick={() => alert("Próximamente")}>
              <div className="settings-icon"><Bell /></div>
              <div className="settings-text">
                <div className="settings-title">Notificaciones de votación</div>
                <div className="settings-desc">Configurar alertas</div>
              </div>
              <CaretRight color="var(--text-muted)" />
            </div>
            <div className="settings-item" onClick={() => alert("Próximamente")}>
              <div className="settings-icon"><IdentificationCard /></div>
              <div className="settings-text">
                <div className="settings-title">Miembros y permisos</div>
                <div className="settings-desc">Gestionar roles en grupos</div>
              </div>
              <CaretRight color="var(--text-muted)" />
            </div>
            <div className="settings-item" onClick={() => alert("Próximamente")}>
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
            <div className="settings-item" onClick={() => alert("Próximamente")}>
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
    </div>
  );
}

// CheckCircle local wrapper since we didn't import it at the top
import { CheckCircle } from "@phosphor-icons/react";

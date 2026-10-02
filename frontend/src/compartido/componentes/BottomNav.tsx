import { House, ListDashes, CheckCircle, User, Link } from "@phosphor-icons/react";

export type Tab = "inicio" | "movimientos" | "unirse" | "aprobaciones" | "perfil";

export default function BottomNav({ active, pendingCount = 0, onChange }: { active: Tab; pendingCount?: number; onChange: (t: Tab) => void }) {
  return (
    <nav className="bottom-nav">
      <button className={`nav-item ${active === "inicio" ? "active" : ""}`} onClick={() => onChange("inicio")}>
        <House weight={active === "inicio" ? "fill" : "regular"} />
        <span>Inicio</span>
      </button>
      <button className={`nav-item ${active === "movimientos" ? "active" : ""}`} onClick={() => onChange("movimientos")}>
        <ListDashes weight={active === "movimientos" ? "fill" : "regular"} />
        <span>Movimientos</span>
      </button>
      <button className={`nav-item ${active === "unirse" ? "active" : ""}`} onClick={() => onChange("unirse")}>
        <Link weight={active === "unirse" ? "fill" : "regular"} />
        <span>Unirse</span>
      </button>
      <button className={`nav-item ${active === "aprobaciones" ? "active" : ""}`} onClick={() => onChange("aprobaciones")}>
        <div style={{ position: "relative" }}>
          <CheckCircle weight={active === "aprobaciones" ? "fill" : "regular"} />
          {pendingCount > 0 && (
            <div style={{
              position: "absolute",
              top: -6,
              right: -10,
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
              {pendingCount}
            </div>
          )}
        </div>
        <span>Aprobaciones</span>
      </button>
      <button className={`nav-item ${active === "perfil" ? "active" : ""}`} onClick={() => onChange("perfil")}>
        <User weight={active === "perfil" ? "fill" : "regular"} />
        <span>Mi Cuenta</span>
      </button>
    </nav>
  );
}

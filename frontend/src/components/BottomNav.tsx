import { House, ListDashes, CheckCircle, User, Link } from "@phosphor-icons/react";

export type Tab = "inicio" | "movimientos" | "unirse" | "aprobaciones" | "perfil";

export default function BottomNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
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

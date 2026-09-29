import { ReactNode } from "react";
import { X } from "@phosphor-icons/react";

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Sheet({ isOpen, onClose, title, children }: SheetProps) {
  if (!isOpen) return null;

  return (
    <div className="sheet-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="sheet-content">
        <div className="sheet-header">
          <div className="sheet-title">{title}</div>
          <button className="sheet-close" onClick={onClose}>
            <X weight="bold" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

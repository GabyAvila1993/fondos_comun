import { jsx as _jsx } from "react/jsx-runtime";
export default function Sheet({ open, onClose, children }) {
    if (!open)
        return null;
    return (_jsx("div", { className: "sheet-overlay show", onClick: (e) => e.target === e.currentTarget && onClose(), children: _jsx("div", { className: "sheet", children: children }) }));
}

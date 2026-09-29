import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { X } from "@phosphor-icons/react";
export default function Sheet({ isOpen, onClose, title, children }) {
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "sheet-overlay", onClick: (e) => {
            if (e.target === e.currentTarget)
                onClose();
        }, children: _jsxs("div", { className: "sheet-content", children: [_jsxs("div", { className: "sheet-header", children: [_jsx("div", { className: "sheet-title", children: title }), _jsx("button", { className: "sheet-close", onClick: onClose, children: _jsx(X, { weight: "bold" }) })] }), children] }) }));
}

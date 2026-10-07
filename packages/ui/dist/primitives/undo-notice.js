"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function UndoNotice({ message, onUndo, onDismiss, pending = false, className, ...props }) {
  return /* @__PURE__ */ jsxs("div", { ...props, className: cx("md-undo-notice md-glass", className), "aria-busy": pending || void 0, children: [
    /* @__PURE__ */ jsx("p", { role: "status", children: message }),
    /* @__PURE__ */ jsxs("div", { className: "md-cluster", children: [
      /* @__PURE__ */ jsx("button", { type: "button", className: "md-button md-button-soft", disabled: pending, onClick: onUndo, children: "Annuler l\u2019action" }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "md-button md-button-ghost", disabled: pending, "aria-label": "Fermer la confirmation", onClick: onDismiss, children: "Fermer" })
    ] })
  ] });
}
export {
  UndoNotice
};

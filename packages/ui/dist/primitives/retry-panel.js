"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function RetryPanel({ message, onRetry, pending = false, retryLabel = "R\xE9essayer", className, ...props }) {
  return /* @__PURE__ */ jsxs("div", { ...props, className: cx("md-retry-panel md-glass md-pad-md", className), "aria-busy": pending || void 0, children: [
    /* @__PURE__ */ jsx("p", { children: message }),
    /* @__PURE__ */ jsx("button", { type: "button", className: "md-button", disabled: pending, onClick: onRetry, children: pending ? "Chargement\u2026" : retryLabel }),
    /* @__PURE__ */ jsx("span", { role: "status", className: "md-sr-only", children: pending ? "Nouvelle tentative en cours." : "" })
  ] });
}
export {
  RetryPanel
};

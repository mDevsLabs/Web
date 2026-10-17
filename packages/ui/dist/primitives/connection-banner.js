"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function ConnectionBanner({ state, onReconnect, className, ...props }) {
  const labels = { online: "Connexion r\xE9tablie.", offline: "Vous \xEAtes hors ligne.", reconnecting: "Reconnexion en cours\u2026" };
  return /* @__PURE__ */ jsxs("div", { ...props, role: "status", className: cx("md-connection-banner", className), "data-state": state, children: [
    /* @__PURE__ */ jsx("span", { children: labels[state] }),
    onReconnect && state === "offline" && /* @__PURE__ */ jsx("button", { type: "button", className: "md-button md-button-outline", onClick: onReconnect, children: "Reconnecter" })
  ] });
}
export {
  ConnectionBanner
};

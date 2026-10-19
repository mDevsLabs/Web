"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function BusyRegion({ label, busy, busyMessage = "Chargement en cours\u2026", children, className, ...props }) {
  return /* @__PURE__ */ jsxs("div", { ...props, className: cx("md-busy-region", className), children: [
    /* @__PURE__ */ jsx("p", { className: "md-busy-message", role: "status", children: busy ? busyMessage : "" }),
    /* @__PURE__ */ jsx("div", { role: "region", "aria-label": label, "aria-busy": busy, children })
  ] });
}
export {
  BusyRegion
};

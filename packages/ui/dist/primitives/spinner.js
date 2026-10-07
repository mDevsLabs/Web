"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function Spinner({ label = "Chargement", className, ...props }) {
  return /* @__PURE__ */ jsxs("span", { ...props, role: "status", className: cx("md-spinner-wrap", className), children: [
    /* @__PURE__ */ jsx("span", { className: "md-spinner", "aria-hidden": "true" }),
    /* @__PURE__ */ jsx("span", { className: "md-sr-only", children: label })
  ] });
}
export {
  Spinner
};

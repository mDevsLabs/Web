"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function FormActions({ status, children, className, ...props }) {
  return /* @__PURE__ */ jsxs("div", { ...props, className: cx("md-form-actions", className), children: [
    /* @__PURE__ */ jsx("div", { className: "md-cluster", children }),
    /* @__PURE__ */ jsx("p", { role: "status", className: "md-muted", children: status })
  ] });
}
export {
  FormActions
};

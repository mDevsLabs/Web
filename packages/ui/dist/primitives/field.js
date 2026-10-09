"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { cx } from "../internal/utils.js";
function Field({ label, htmlFor, hint, error, className, children, ...props }) {
  return /* @__PURE__ */ jsxs("div", { ...props, className: cx("md-field", className), children: [
    /* @__PURE__ */ jsx("label", { htmlFor, children: label }),
    children,
    hint && /* @__PURE__ */ jsx("p", { id: `${htmlFor}-hint`, className: "md-muted", children: hint }),
    error && /* @__PURE__ */ jsx("p", { id: `${htmlFor}-error`, className: "md-error", role: "alert", children: error })
  ] });
}
export {
  Field
};

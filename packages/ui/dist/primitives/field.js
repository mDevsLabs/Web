"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { cloneElement, isValidElement } from "react";
import { cx } from "../internal/utils.js";
function Field({ label, htmlFor, hint, error, className, children, ...props }) {
  const describedBy = [
    hint ? `${htmlFor}-hint` : null,
    error ? `${htmlFor}-error` : null
  ].filter(Boolean).join(" ") || void 0;

  const content = isValidElement(children) ? cloneElement(children, {
    id: children.props.id || htmlFor,
    "aria-describedby": children.props["aria-describedby"] || describedBy,
    "aria-invalid": children.props["aria-invalid"] ?? (error ? true : void 0)
  }) : children;

  return /* @__PURE__ */ jsxs("div", { ...props, className: cx("md-field", className), children: [
    /* @__PURE__ */ jsx("label", { htmlFor, children: label }),
    content,
    hint && /* @__PURE__ */ jsx("p", { id: `${htmlFor}-hint`, className: "md-muted", children: hint }),
    error && /* @__PURE__ */ jsx("p", { id: `${htmlFor}-error`, className: "md-error", role: "alert", children: error })
  ] });
}
export {
  Field
};

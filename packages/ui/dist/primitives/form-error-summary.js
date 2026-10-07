"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { cx } from "../internal/utils.js";
function FormErrorSummary({ errors, heading = "Corrigez les champs suivants", className, ...props }) {
  const id = useId();
  if (!errors.length)
    return null;
  return /* @__PURE__ */ jsxs("div", { ...props, role: "alert", "aria-labelledby": id, className: cx("md-error-summary", className), children: [
    /* @__PURE__ */ jsx("h3", { id, children: heading }),
    /* @__PURE__ */ jsx("ul", { children: errors.map((error, index) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: `#${error.fieldId}`, children: error.message }) }, `${error.fieldId}-${index}`)) })
  ] });
}
export {
  FormErrorSummary
};

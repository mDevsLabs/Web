"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { cx } from "../internal/utils.js";
function ConsentField({ label, checked, onCheckedChange, children, required = true, disabled, name, className, ...props }) {
  const id = useId();
  return /* @__PURE__ */ jsxs("div", { ...props, className: cx("md-consent-field", className), children: [
    /* @__PURE__ */ jsxs("label", { htmlFor: id, children: [
      /* @__PURE__ */ jsx("input", { id, type: "checkbox", name, required, disabled, checked, "aria-describedby": children ? `${id}-terms` : void 0, onChange: (event) => onCheckedChange(event.target.checked) }),
      label,
      required && /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: " *" })
    ] }),
    children && /* @__PURE__ */ jsx("div", { id: `${id}-terms`, className: "md-muted", children })
  ] });
}
export {
  ConsentField
};

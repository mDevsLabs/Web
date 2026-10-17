"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { Checkbox as RCheckbox } from "radix-ui";
import { cx } from "../internal/utils.js";
function Checkbox({ label, className, id, ...props }) {
  const generated = useId();
  const inputId = id ?? generated;
  return /* @__PURE__ */ jsxs("div", { className: "md-check-row", children: [
    /* @__PURE__ */ jsx(RCheckbox.Root, { ...props, id: inputId, className: cx("md-checkbox", className), children: /* @__PURE__ */ jsx(RCheckbox.Indicator, { children: "\u2713" }) }),
    /* @__PURE__ */ jsx("label", { htmlFor: inputId, children: label })
  ] });
}
export {
  Checkbox
};

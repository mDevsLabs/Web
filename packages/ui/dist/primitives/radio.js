"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { cx } from "../internal/utils.js";
function Radio({ label, className, id, ...props }) {
  const generated = useId();
  const inputId = id ?? generated;
  return /* @__PURE__ */ jsxs("div", { className: "md-check-row", children: [
    /* @__PURE__ */ jsx("input", { ...props, id: inputId, type: "radio", className: cx("md-radio", className) }),
    /* @__PURE__ */ jsx("label", { htmlFor: inputId, children: label })
  ] });
}
export {
  Radio
};

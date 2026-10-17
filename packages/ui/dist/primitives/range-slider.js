"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { cx } from "../internal/utils.js";
function RangeSlider({ label, id, className, ...props }) {
  const generated = useId();
  return /* @__PURE__ */ jsxs("div", { className: "md-field", children: [
    /* @__PURE__ */ jsx("label", { htmlFor: id ?? generated, children: label }),
    /* @__PURE__ */ jsx("input", { ...props, id: id ?? generated, type: "range", className: cx("md-range", className) })
  ] });
}
export {
  RangeSlider
};

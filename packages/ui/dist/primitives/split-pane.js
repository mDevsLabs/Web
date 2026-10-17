"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { cx } from "../internal/utils.js";
function SplitPane({ primary, secondary, value, onValueChange, min = 20, max = 80, label = "Largeur du premier panneau", className, style, ...props }) {
  const id = useId();
  const low = Math.max(10, Math.min(90, Number.isFinite(min) ? min : 20));
  const high = Math.max(low, Math.min(90, Number.isFinite(max) ? max : 80));
  const percent = Math.max(low, Math.min(high, Number.isFinite(value) ? value : 50));
  return /* @__PURE__ */ jsxs("div", { ...props, className: cx("md-split-pane", className), style: { ...style, "--md-split": `${percent}%` }, children: [
    /* @__PURE__ */ jsxs("div", { className: "md-split-content", children: [
      /* @__PURE__ */ jsx("div", { children: primary }),
      /* @__PURE__ */ jsx("div", { children: secondary })
    ] }),
    /* @__PURE__ */ jsxs("label", { className: "md-field", htmlFor: id, children: [
      label,
      /* @__PURE__ */ jsx("input", { id, className: "md-range", type: "range", min: low, max: high, value: percent, onChange: (event) => onValueChange(event.target.valueAsNumber) })
    ] })
  ] });
}
export {
  SplitPane
};

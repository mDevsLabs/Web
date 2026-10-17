"use client";
"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { cx } from "../internal/utils.js";
function Sparkline({ label, values, width = 160, height = 48, className, ...props }) {
  const id = useId();
  const valid = values.filter(Number.isFinite);
  const low = valid.length ? Math.min(...valid) : 0;
  const high = valid.length ? Math.max(...valid) : 1;
  const range = high - low || 1;
  const w = Number.isFinite(width) ? Math.max(16, width) : 160;
  const h = Number.isFinite(height) ? Math.max(16, height) : 48;
  const points = valid.map((value, index) => `${valid.length === 1 ? w / 2 : 4 + index / (valid.length - 1) * (w - 8)},${h - 4 - (value - low) / range * (h - 8)}`).join(" ");
  return /* @__PURE__ */ jsxs("figure", { ...props, className: cx("md-sparkline", className), "aria-labelledby": id, children: [
    /* @__PURE__ */ jsx("figcaption", { id, children: label }),
    /* @__PURE__ */ jsx("svg", { width: w, height: h, viewBox: `0 0 ${w} ${h}`, "aria-hidden": "true", focusable: "false", children: valid.length > 1 ? /* @__PURE__ */ jsx("polyline", { points, fill: "none", stroke: "currentColor", strokeWidth: "1.5", vectorEffect: "non-scaling-stroke" }) : valid.length === 1 ? /* @__PURE__ */ jsx("circle", { cx: w / 2, cy: h - 4 - (valid[0] - low) / range * (h - 8), r: "2", fill: "currentColor" }) : null }),
    /* @__PURE__ */ jsx("span", { className: "md-sr-only", children: valid.length ? `Valeurs : ${valid.join(", ")}` : "Aucune valeur." })
  ] });
}
export {
  Sparkline
};

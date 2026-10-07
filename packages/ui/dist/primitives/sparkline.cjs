"use client";
"use strict";
"use client";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var sparkline_exports = {};
__export(sparkline_exports, {
  Sparkline: () => Sparkline
});
module.exports = __toCommonJS(sparkline_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
function Sparkline({ label, values, width = 160, height = 48, className, ...props }) {
  const id = (0, import_react.useId)();
  const valid = values.filter(Number.isFinite);
  const low = valid.length ? Math.min(...valid) : 0;
  const high = valid.length ? Math.max(...valid) : 1;
  const range = high - low || 1;
  const w = Number.isFinite(width) ? Math.max(16, width) : 160;
  const h = Number.isFinite(height) ? Math.max(16, height) : 48;
  const points = valid.map((value, index) => `${valid.length === 1 ? w / 2 : 4 + index / (valid.length - 1) * (w - 8)},${h - 4 - (value - low) / range * (h - 8)}`).join(" ");
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", { ...props, className: (0, import_utils.cx)("md-sparkline", className), "aria-labelledby": id, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("figcaption", { id, children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { width: w, height: h, viewBox: `0 0 ${w} ${h}`, "aria-hidden": "true", focusable: "false", children: valid.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("polyline", { points, fill: "none", stroke: "currentColor", strokeWidth: "1.5", vectorEffect: "non-scaling-stroke" }) : valid.length === 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: w / 2, cy: h - 4 - (valid[0] - low) / range * (h - 8), r: "2", fill: "currentColor" }) : null }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "md-sr-only", children: valid.length ? `Valeurs : ${valid.join(", ")}` : "Aucune valeur." })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Sparkline
});

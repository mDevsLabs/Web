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
var bar_chart_exports = {};
__export(bar_chart_exports, {
  BarChart: () => BarChart
});
module.exports = __toCommonJS(bar_chart_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
function BarChart({ title, items, unit = "", className, ...props }) {
  const id = (0, import_react.useId)();
  const maximum = Math.max(1, ...items.map((item) => Number.isFinite(item.value) ? Math.max(0, item.value) : 0));
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", { ...props, className: (0, import_utils.cx)("md-bar-chart", className), "aria-labelledby": id, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("figcaption", { id, children: title }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", { children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: item.label }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
          item.value,
          unit && ` ${unit}`
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "md-chart-track", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { width: `${Math.max(0, Math.min(100, Number.isFinite(item.value) ? item.value / maximum * 100 : 0))}%` } }) })
      ] })
    ] }, item.id)) })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BarChart
});

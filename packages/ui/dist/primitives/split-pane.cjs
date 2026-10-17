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
var split_pane_exports = {};
__export(split_pane_exports, {
  SplitPane: () => SplitPane
});
module.exports = __toCommonJS(split_pane_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_utils = require("../internal/utils.cjs");
function SplitPane({ primary, secondary, value, onValueChange, min = 20, max = 80, label = "Largeur du premier panneau", className, style, ...props }) {
  const id = (0, import_react.useId)();
  const low = Math.max(10, Math.min(90, Number.isFinite(min) ? min : 20));
  const high = Math.max(low, Math.min(90, Number.isFinite(max) ? max : 80));
  const percent = Math.max(low, Math.min(high, Number.isFinite(value) ? value : 50));
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { ...props, className: (0, import_utils.cx)("md-split-pane", className), style: { ...style, "--md-split": `${percent}%` }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "md-split-content", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: primary }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: secondary })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "md-field", htmlFor: id, children: [
      label,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { id, className: "md-range", type: "range", min: low, max: high, value: percent, onChange: (event) => onValueChange(event.target.valueAsNumber) })
    ] })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SplitPane
});

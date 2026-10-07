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
var stat_exports = {};
__export(stat_exports, {
  Stat: () => Stat
});
module.exports = __toCommonJS(stat_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_utils = require("../internal/utils.cjs");
function Stat({ label, value, change, tone = "neutral", className, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { ...props, className: (0, import_utils.cx)("md-glass md-stat", className), "data-tone": tone, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: label }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: value })
    ] }),
    change && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: change })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Stat
});

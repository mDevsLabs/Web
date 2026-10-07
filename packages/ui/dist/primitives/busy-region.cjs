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
var busy_region_exports = {};
__export(busy_region_exports, {
  BusyRegion: () => BusyRegion
});
module.exports = __toCommonJS(busy_region_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_utils = require("../internal/utils.cjs");
function BusyRegion({ label, busy, busyMessage = "Chargement en cours\u2026", children, className, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { ...props, className: (0, import_utils.cx)("md-busy-region", className), children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "md-busy-message", role: "status", children: busy ? busyMessage : "" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { role: "region", "aria-label": label, "aria-busy": busy, children })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BusyRegion
});

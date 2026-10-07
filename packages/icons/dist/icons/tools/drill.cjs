"use client";
"use strict";
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
var drill_exports = {};
__export(drill_exports, {
  DrillIcon: () => DrillIcon
});
module.exports = __toCommonJS(drill_exports);
var import_create_icon = require("../../create-icon.cjs");
const DrillIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("DrillIcon", [["path", { "d": "M10 18a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H5a3 3 0 0 1-3-3 1 1 0 0 1 1-1z" }], ["path", { "d": "M13 10H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1l-.81 3.242a1 1 0 0 1-.97.758H8" }], ["path", { "d": "M14 4h3a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-3" }], ["path", { "d": "M18 6h4" }], ["path", { "d": "m5 10-2 8" }], ["path", { "d": "m7 18 2-8" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DrillIcon
});

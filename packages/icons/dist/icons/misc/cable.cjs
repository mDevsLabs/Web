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
var cable_exports = {};
__export(cable_exports, {
  CableIcon: () => CableIcon
});
module.exports = __toCommonJS(cable_exports);
var import_create_icon = require("../../create-icon.cjs");
const CableIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CableIcon", [["path", { "d": "M17 19a1 1 0 0 1-1-1v-2a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a1 1 0 0 1-1 1z" }], ["path", { "d": "M17 21v-2" }], ["path", { "d": "M19 14V6.5a1 1 0 0 0-7 0v11a1 1 0 0 1-7 0V10" }], ["path", { "d": "M21 21v-2" }], ["path", { "d": "M3 5V3" }], ["path", { "d": "M4 10a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2a2 2 0 0 1-2 2z" }], ["path", { "d": "M7 5V3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CableIcon
});

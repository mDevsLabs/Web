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
var dam_exports = {};
__export(dam_exports, {
  DamIcon: () => DamIcon
});
module.exports = __toCommonJS(dam_exports);
var import_create_icon = require("../../create-icon.cjs");
const DamIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("DamIcon", [["path", { "d": "M11 11.31c1.17.56 1.54 1.69 3.5 1.69 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" }], ["path", { "d": "M11.75 18c.35.5 1.45 1 2.75 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" }], ["path", { "d": "M2 10h4" }], ["path", { "d": "M2 14h4" }], ["path", { "d": "M2 18h4" }], ["path", { "d": "M2 6h4" }], ["path", { "d": "M7 3a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1L10 4a1 1 0 0 0-1-1z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DamIcon
});

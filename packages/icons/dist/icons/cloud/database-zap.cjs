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
var database_zap_exports = {};
__export(database_zap_exports, {
  DatabaseZapIcon: () => DatabaseZapIcon
});
module.exports = __toCommonJS(database_zap_exports);
var import_create_icon = require("../../create-icon.cjs");
const DatabaseZapIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("DatabaseZapIcon", [["ellipse", { "cx": "12", "cy": "5", "rx": "9", "ry": "3" }], ["path", { "d": "M3 5V19A9 3 0 0 0 15 21.84" }], ["path", { "d": "M21 5V8" }], ["path", { "d": "M21 12L18 17H22L19 22" }], ["path", { "d": "M3 12A9 3 0 0 0 14.59 14.87" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DatabaseZapIcon
});

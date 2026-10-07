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
var castle_exports = {};
__export(castle_exports, {
  CastleIcon: () => CastleIcon
});
module.exports = __toCommonJS(castle_exports);
var import_create_icon = require("../../create-icon.cjs");
const CastleIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CastleIcon", [["path", { "d": "M10 5V3" }], ["path", { "d": "M14 5V3" }], ["path", { "d": "M15 21v-3a3 3 0 0 0-6 0v3" }], ["path", { "d": "M18 3v8" }], ["path", { "d": "M18 5H6" }], ["path", { "d": "M22 11H2" }], ["path", { "d": "M22 9v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9" }], ["path", { "d": "M6 3v8" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CastleIcon
});

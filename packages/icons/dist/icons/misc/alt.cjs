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
var alt_exports = {};
__export(alt_exports, {
  AltIcon: () => AltIcon
});
module.exports = __toCommonJS(alt_exports);
var import_create_icon = require("../../create-icon.cjs");
const AltIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AltIcon", [["path", { "d": "M4 16v-6a2 2 0 1 1 4 0v6" }], ["path", { "d": "M4 13h4" }], ["path", { "d": "M11 8v8h4" }], ["path", { "d": "M16 8h4" }], ["path", { "d": "M18 8v8" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AltIcon
});

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
var ampersand_exports = {};
__export(ampersand_exports, {
  AmpersandIcon: () => AmpersandIcon
});
module.exports = __toCommonJS(ampersand_exports);
var import_create_icon = require("../../create-icon.cjs");
const AmpersandIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AmpersandIcon", [["path", { "d": "M16 12h3" }], ["path", { "d": "M17.5 12a8 8 0 0 1-8 8A4.5 4.5 0 0 1 5 15.5c0-6 8-4 8-8.5a3 3 0 1 0-6 0c0 3 2.5 8.5 12 13" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AmpersandIcon
});

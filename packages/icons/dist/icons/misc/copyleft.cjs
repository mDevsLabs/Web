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
var copyleft_exports = {};
__export(copyleft_exports, {
  CopyleftIcon: () => CopyleftIcon
});
module.exports = __toCommonJS(copyleft_exports);
var import_create_icon = require("../../create-icon.cjs");
const CopyleftIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CopyleftIcon", [["circle", { "cx": "12", "cy": "12", "r": "10" }], ["path", { "d": "M9.17 14.83a4 4 0 1 0 0-5.66" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CopyleftIcon
});

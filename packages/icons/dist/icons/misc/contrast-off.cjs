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
var contrast_off_exports = {};
__export(contrast_off_exports, {
  ContrastOffIcon: () => ContrastOffIcon
});
module.exports = __toCommonJS(contrast_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const ContrastOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ContrastOffIcon", [["path", { "d": "M12 12v5a4.984 4.984 0 0 0 3.522 -1.45m1.392 -2.623a5 5 0 0 0 -4.914 -5.927v1" }], ["path", { "d": "M5.641 5.631a9 9 0 1 0 12.719 12.738m1.68 -2.318a9 9 0 0 0 -12.074 -12.098" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ContrastOffIcon
});

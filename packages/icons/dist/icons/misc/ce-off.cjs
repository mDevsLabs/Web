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
var ce_off_exports = {};
__export(ce_off_exports, {
  CeOffIcon: () => CeOffIcon
});
module.exports = __toCommonJS(ce_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const CeOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CeOffIcon", [["path", { "d": "M6.53 6.53a6.001 6.001 0 0 0 2.47 11.47" }], ["path", { "d": "M21 6a6 6 0 0 0 -5.927 5.061l.927 .939" }], ["path", { "d": "M16 12h5" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CeOffIcon
});

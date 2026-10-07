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
var nfc_exports = {};
__export(nfc_exports, {
  NfcIcon: () => NfcIcon
});
module.exports = __toCommonJS(nfc_exports);
var import_create_icon = require("../../create-icon.cjs");
const NfcIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("NfcIcon", [["path", { "d": "M6 8.32a7.43 7.43 0 0 1 0 7.36" }], ["path", { "d": "M9.46 6.21a11.76 11.76 0 0 1 0 11.58" }], ["path", { "d": "M12.91 4.1a15.91 15.91 0 0 1 .01 15.8" }], ["path", { "d": "M16.37 2a20.16 20.16 0 0 1 0 20" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  NfcIcon
});

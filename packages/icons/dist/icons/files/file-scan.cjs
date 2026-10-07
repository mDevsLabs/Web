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
var file_scan_exports = {};
__export(file_scan_exports, {
  FileScanIcon: () => FileScanIcon
});
module.exports = __toCommonJS(file_scan_exports);
var import_create_icon = require("../../create-icon.cjs");
const FileScanIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("FileScanIcon", [["path", { "d": "M20 10V8a2.4 2.4 0 0 0-.706-1.704l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h4.35" }], ["path", { "d": "M14 2v5a1 1 0 0 0 1 1h5" }], ["path", { "d": "M16 14a2 2 0 0 0-2 2" }], ["path", { "d": "M16 22a2 2 0 0 1-2-2" }], ["path", { "d": "M20 14a2 2 0 0 1 2 2" }], ["path", { "d": "M20 22a2 2 0 0 0 2-2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FileScanIcon
});

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
var scan_box_exports = {};
__export(scan_box_exports, {
  ScanBoxIcon: () => ScanBoxIcon
});
module.exports = __toCommonJS(scan_box_exports);
var import_create_icon = require("../../create-icon.cjs");
const ScanBoxIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ScanBoxIcon", [["path", { "d": "M12 12v5.5" }], ["path", { "d": "M17 3h2a2 2 0 012 2v2" }], ["path", { "d": "M21 17v2a2 2 0 01-2 2h-2" }], ["path", { "d": "M3 7V5a2 2 0 012-2h2" }], ["path", { "d": "M7 21H5a2 2 0 01-2-2v-2" }], ["path", { "d": "M7.264 9.252 12 12l4.737-2.748" }], ["path", { "d": "M7.995 8.514A2 2 0 007 10.244v3.516a2 2 0 00.996 1.73l3 1.74a2 2 0 002.008 0l3-1.74A2 2 0 0017 13.76v-3.517a2 2 0 00-.995-1.73l-3-1.742a2 2 0 00-1.892-.064z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ScanBoxIcon
});

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
var scan_heart_exports = {};
__export(scan_heart_exports, {
  ScanHeartIcon: () => ScanHeartIcon
});
module.exports = __toCommonJS(scan_heart_exports);
var import_create_icon = require("../../create-icon.cjs");
const ScanHeartIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ScanHeartIcon", [["path", { "d": "M17 3h2a2 2 0 0 1 2 2v2" }], ["path", { "d": "M21 17v2a2 2 0 0 1-2 2h-2" }], ["path", { "d": "M3 7V5a2 2 0 0 1 2-2h2" }], ["path", { "d": "M7 21H5a2 2 0 0 1-2-2v-2" }], ["path", { "d": "M7.828 13.07A3 3 0 0 1 12 8.764a3 3 0 0 1 4.172 4.306l-3.447 3.62a1 1 0 0 1-1.449 0z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ScanHeartIcon
});

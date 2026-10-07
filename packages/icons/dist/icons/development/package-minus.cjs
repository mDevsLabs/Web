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
var package_minus_exports = {};
__export(package_minus_exports, {
  PackageMinusIcon: () => PackageMinusIcon
});
module.exports = __toCommonJS(package_minus_exports);
var import_create_icon = require("../../create-icon.cjs");
const PackageMinusIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("PackageMinusIcon", [["path", { "d": "M12 22V12" }], ["path", { "d": "M16 17h6" }], ["path", { "d": "M21 13V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.729l7 4a2 2 0 0 0 2 .001l1.675-.955" }], ["path", { "d": "M3.29 7 12 12l8.71-5" }], ["path", { "d": "m7.5 4.27 8.997 5.148" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PackageMinusIcon
});

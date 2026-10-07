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
var bath_off_exports = {};
__export(bath_off_exports, {
  BathOffIcon: () => BathOffIcon
});
module.exports = __toCommonJS(bath_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const BathOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BathOffIcon", [["path", { "d": "M16 12h4a1 1 0 0 1 1 1v3c0 .311 -.036 .614 -.103 .904m-1.61 2.378a3.982 3.982 0 0 1 -2.287 .718h-10a4 4 0 0 1 -4 -4v-3a1 1 0 0 1 1 -1h8" }], ["path", { "d": "M6 12v-6m1.178 -2.824c.252 -.113 .53 -.176 .822 -.176h3v2.25" }], ["path", { "d": "M4 21l1 -1.5" }], ["path", { "d": "M20 21l-1 -1.5" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BathOffIcon
});

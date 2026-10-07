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
var broccoli_exports = {};
__export(broccoli_exports, {
  BroccoliIcon: () => BroccoliIcon
});
module.exports = __toCommonJS(broccoli_exports);
var import_create_icon = require("../../create-icon.cjs");
const BroccoliIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BroccoliIcon", [["path", { "d": "M10 13a3 3 0 01-2.121-5.121" }], ["path", { "d": "M15.606 14.204c-3.5 1.5-5.899 4.503-8.899 7.503A1 1 0 016 22c-2 0-4-2-4-4a1 1 0 01.293-.707c1.911-1.911 3.823-3.578 5.347-5.441" }], ["path", { "d": "M16.573 14.737A4 4 0 0114 11" }], ["path", { "d": "M7.14 10.907a4 4 0 112.756-7.43A4 4 0 0116.7 4.48a2 2 0 012.82 2.82 4 4 0 011.002 6.805 4 4 0 11-7.51 1.59" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BroccoliIcon
});

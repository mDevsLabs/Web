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
var bowling_exports = {};
__export(bowling_exports, {
  BowlingIcon: () => BowlingIcon
});
module.exports = __toCommonJS(bowling_exports);
var import_create_icon = require("../../create-icon.cjs");
const BowlingIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BowlingIcon", [["path", { "d": "M7 11v.01" }], ["path", { "d": "M11 10v.01" }], ["path", { "d": "M10 14v.01" }], ["path", { "d": "M11.059 6.07a8 8 0 1 0 .32 15.81" }], ["path", { "d": "M15.969 9h4" }], ["path", { "d": "M14.969 5c0 1.5 1 2 1 4c0 2.5 -2 4.5 -2 7c0 2.6 1.9 6 1.9 6h4.1s2 -3.4 2 -6c0 -2.5 -2 -4.5 -2 -7c0 -2 1 -2.5 1 -4a3 3 0 1 0 -6 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BowlingIcon
});

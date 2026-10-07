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
var saudi_riyal_exports = {};
__export(saudi_riyal_exports, {
  SaudiRiyalIcon: () => SaudiRiyalIcon
});
module.exports = __toCommonJS(saudi_riyal_exports);
var import_create_icon = require("../../create-icon.cjs");
const SaudiRiyalIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SaudiRiyalIcon", [["path", { "d": "m20 19.5-5.5 1.2" }], ["path", { "d": "M14.5 4v11.22a1 1 0 0 0 1.242.97L20 15.2" }], ["path", { "d": "m2.978 19.351 5.549-1.363A2 2 0 0 0 10 16V2" }], ["path", { "d": "M20 10 4 13.5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SaudiRiyalIcon
});

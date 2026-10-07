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
var a_arrow_down_exports = {};
__export(a_arrow_down_exports, {
  AArrowDownIcon: () => AArrowDownIcon
});
module.exports = __toCommonJS(a_arrow_down_exports);
var import_create_icon = require("../../create-icon.cjs");
const AArrowDownIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AArrowDownIcon", [["path", { "d": "m14 12 4 4 4-4" }], ["path", { "d": "M18 16V7" }], ["path", { "d": "m2 16 4.039-9.69a.5.5 0 0 1 .923 0L11 16" }], ["path", { "d": "M3.304 13h6.392" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AArrowDownIcon
});

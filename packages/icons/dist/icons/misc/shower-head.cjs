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
var shower_head_exports = {};
__export(shower_head_exports, {
  ShowerHeadIcon: () => ShowerHeadIcon
});
module.exports = __toCommonJS(shower_head_exports);
var import_create_icon = require("../../create-icon.cjs");
const ShowerHeadIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ShowerHeadIcon", [["path", { "d": "m4 4 2.5 2.5" }], ["path", { "d": "M13.5 6.5a4.95 4.95 0 0 0-7 7" }], ["path", { "d": "M15 5 5 15" }], ["path", { "d": "M14 17v.01" }], ["path", { "d": "M10 16v.01" }], ["path", { "d": "M13 13v.01" }], ["path", { "d": "M16 10v.01" }], ["path", { "d": "M11 20v.01" }], ["path", { "d": "M17 14v.01" }], ["path", { "d": "M20 11v.01" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ShowerHeadIcon
});

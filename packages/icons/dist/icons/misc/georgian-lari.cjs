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
var georgian_lari_exports = {};
__export(georgian_lari_exports, {
  GeorgianLariIcon: () => GeorgianLariIcon
});
module.exports = __toCommonJS(georgian_lari_exports);
var import_create_icon = require("../../create-icon.cjs");
const GeorgianLariIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("GeorgianLariIcon", [["path", { "d": "M11.5 21a7.5 7.5 0 1 1 7.35-9" }], ["path", { "d": "M13 12V3" }], ["path", { "d": "M4 21h16" }], ["path", { "d": "M9 12V3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GeorgianLariIcon
});

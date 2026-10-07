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
var turkish_lira_exports = {};
__export(turkish_lira_exports, {
  TurkishLiraIcon: () => TurkishLiraIcon
});
module.exports = __toCommonJS(turkish_lira_exports);
var import_create_icon = require("../../create-icon.cjs");
const TurkishLiraIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("TurkishLiraIcon", [["path", { "d": "M15 4 5 9" }], ["path", { "d": "m15 8.5-10 5" }], ["path", { "d": "M18 12a9 9 0 0 1-9 9V3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TurkishLiraIcon
});

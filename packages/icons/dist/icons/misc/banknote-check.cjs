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
var banknote_check_exports = {};
__export(banknote_check_exports, {
  BanknoteCheckIcon: () => BanknoteCheckIcon
});
module.exports = __toCommonJS(banknote_check_exports);
var import_create_icon = require("../../create-icon.cjs");
const BanknoteCheckIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BanknoteCheckIcon", [["path", { "d": "M11.748 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4.875" }], ["path", { "d": "m16 19 2 2 4-4" }], ["path", { "d": "M18 12h.01" }], ["path", { "d": "M6 12h.01" }], ["circle", { "cx": "12", "cy": "12", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BanknoteCheckIcon
});

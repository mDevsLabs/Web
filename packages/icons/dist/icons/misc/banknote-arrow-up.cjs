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
var banknote_arrow_up_exports = {};
__export(banknote_arrow_up_exports, {
  BanknoteArrowUpIcon: () => BanknoteArrowUpIcon
});
module.exports = __toCommonJS(banknote_arrow_up_exports);
var import_create_icon = require("../../create-icon.cjs");
const BanknoteArrowUpIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BanknoteArrowUpIcon", [["path", { "d": "M12 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5" }], ["path", { "d": "M18 12h.01" }], ["path", { "d": "M19 22v-6" }], ["path", { "d": "m22 19-3-3-3 3" }], ["path", { "d": "M6 12h.01" }], ["circle", { "cx": "12", "cy": "12", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BanknoteArrowUpIcon
});

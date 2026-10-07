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
var currency_dram_exports = {};
__export(currency_dram_exports, {
  CurrencyDramIcon: () => CurrencyDramIcon
});
module.exports = __toCommonJS(currency_dram_exports);
var import_create_icon = require("../../create-icon.cjs");
const CurrencyDramIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CurrencyDramIcon", [["path", { "d": "M4 10a6 6 0 1 1 12 0v10" }], ["path", { "d": "M12 16h8" }], ["path", { "d": "M12 12h8" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CurrencyDramIcon
});

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
var currency_cent_exports = {};
__export(currency_cent_exports, {
  CurrencyCentIcon: () => CurrencyCentIcon
});
module.exports = __toCommonJS(currency_cent_exports);
var import_create_icon = require("../../create-icon.cjs");
const CurrencyCentIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CurrencyCentIcon", [["path", { "d": "M16.007 7.54a5.965 5.965 0 0 0 -4.008 -1.54a6 6 0 0 0 -5.992 6c0 3.314 2.682 6 5.992 6a5.965 5.965 0 0 0 4 -1.536" }], ["path", { "d": "M12 20v-2" }], ["path", { "d": "M12 6v-2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CurrencyCentIcon
});

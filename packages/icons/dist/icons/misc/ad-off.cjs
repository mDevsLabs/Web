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
var ad_off_exports = {};
__export(ad_off_exports, {
  AdOffIcon: () => AdOffIcon
});
module.exports = __toCommonJS(ad_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const AdOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AdOffIcon", [["path", { "d": "M9 5h10a2 2 0 0 1 2 2v10m-2 2h-14a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2" }], ["path", { "d": "M7 15v-4a2 2 0 0 1 2 -2m2 2v4" }], ["path", { "d": "M7 13h4" }], ["path", { "d": "M17 9v4" }], ["path", { "d": "M16.115 12.131c.33 .149 .595 .412 .747 .74" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AdOffIcon
});

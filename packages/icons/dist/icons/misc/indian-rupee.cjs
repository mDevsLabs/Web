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
var indian_rupee_exports = {};
__export(indian_rupee_exports, {
  IndianRupeeIcon: () => IndianRupeeIcon
});
module.exports = __toCommonJS(indian_rupee_exports);
var import_create_icon = require("../../create-icon.cjs");
const IndianRupeeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("IndianRupeeIcon", [["path", { "d": "M6 3h12" }], ["path", { "d": "M6 8h12" }], ["path", { "d": "m6 13 8.5 8" }], ["path", { "d": "M6 13h3" }], ["path", { "d": "M9 13c6.667 0 6.667-10 0-10" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  IndianRupeeIcon
});

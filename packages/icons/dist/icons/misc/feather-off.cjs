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
var feather_off_exports = {};
__export(feather_off_exports, {
  FeatherOffIcon: () => FeatherOffIcon
});
module.exports = __toCommonJS(feather_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const FeatherOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("FeatherOffIcon", [["path", { "d": "M4 20l8 -8" }], ["path", { "d": "M14 5v5h5" }], ["path", { "d": "M9 11v4h4" }], ["path", { "d": "M6 13v5h5" }], ["path", { "d": "M6 13l3.502 -3.502m2.023 -2.023l2.475 -2.475" }], ["path", { "d": "M19 10c.638 -.636 1 -1.515 1 -2.486a3.515 3.515 0 0 0 -3.517 -3.514c-.97 0 -1.847 .367 -2.483 1" }], ["path", { "d": "M11 18l3.499 -3.499m2.008 -2.008l2.493 -2.493" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FeatherOffIcon
});

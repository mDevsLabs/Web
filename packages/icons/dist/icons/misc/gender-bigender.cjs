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
var gender_bigender_exports = {};
__export(gender_bigender_exports, {
  GenderBigenderIcon: () => GenderBigenderIcon
});
module.exports = __toCommonJS(gender_bigender_exports);
var import_create_icon = require("../../create-icon.cjs");
const GenderBigenderIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("GenderBigenderIcon", [["path", { "d": "M7 11a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" }], ["path", { "d": "M19 3l-5 5" }], ["path", { "d": "M15 3h4v4" }], ["path", { "d": "M11 16v6" }], ["path", { "d": "M8 19h6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GenderBigenderIcon
});

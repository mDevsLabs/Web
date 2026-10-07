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
var gender_intergender_exports = {};
__export(gender_intergender_exports, {
  GenderIntergenderIcon: () => GenderIntergenderIcon
});
module.exports = __toCommonJS(gender_intergender_exports);
var import_create_icon = require("../../create-icon.cjs");
const GenderIntergenderIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("GenderIntergenderIcon", [["path", { "d": "M13.5 11.5l6.5 6.5v-4" }], ["path", { "d": "M11.5 13.5l6.5 6.5" }], ["path", { "d": "M9 4a5 5 0 1 1 0 10a5 5 0 0 1 0 -10" }], ["path", { "d": "M14 20l2 -2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GenderIntergenderIcon
});

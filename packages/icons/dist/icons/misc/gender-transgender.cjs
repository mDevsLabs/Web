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
var gender_transgender_exports = {};
__export(gender_transgender_exports, {
  GenderTransgenderIcon: () => GenderTransgenderIcon
});
module.exports = __toCommonJS(gender_transgender_exports);
var import_create_icon = require("../../create-icon.cjs");
const GenderTransgenderIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("GenderTransgenderIcon", [["path", { "d": "M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" }], ["path", { "d": "M15 9l6 -6" }], ["path", { "d": "M21 7v-4h-4" }], ["path", { "d": "M9 9l-6 -6" }], ["path", { "d": "M3 7v-4h4" }], ["path", { "d": "M5.5 8.5l3 -3" }], ["path", { "d": "M12 16v5" }], ["path", { "d": "M9.5 19h5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GenderTransgenderIcon
});

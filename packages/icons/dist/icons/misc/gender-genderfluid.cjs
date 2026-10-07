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
var gender_genderfluid_exports = {};
__export(gender_genderfluid_exports, {
  GenderGenderfluidIcon: () => GenderGenderfluidIcon
});
module.exports = __toCommonJS(gender_genderfluid_exports);
var import_create_icon = require("../../create-icon.cjs");
const GenderGenderfluidIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("GenderGenderfluidIcon", [["path", { "d": "M10 15.464a4 4 0 1 0 4 -6.928a4 4 0 0 0 -4 6.928" }], ["path", { "d": "M15.464 14l3 -5.196" }], ["path", { "d": "M5.536 15.195l3 -5.196" }], ["path", { "d": "M12 12h.01" }], ["path", { "d": "M9 9l-6 -6" }], ["path", { "d": "M5.5 8.5l3 -3" }], ["path", { "d": "M21 21l-6 -6" }], ["path", { "d": "M17 20l3 -3" }], ["path", { "d": "M3 7v-4h4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GenderGenderfluidIcon
});

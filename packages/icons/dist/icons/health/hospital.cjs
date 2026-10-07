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
var hospital_exports = {};
__export(hospital_exports, {
  HospitalIcon: () => HospitalIcon
});
module.exports = __toCommonJS(hospital_exports);
var import_create_icon = require("../../create-icon.cjs");
const HospitalIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("HospitalIcon", [["path", { "d": "M12 7v4" }], ["path", { "d": "M14 21v-3a2 2 0 0 0-4 0v3" }], ["path", { "d": "M14 9h-4" }], ["path", { "d": "M18 11h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2" }], ["path", { "d": "M18 21V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HospitalIcon
});

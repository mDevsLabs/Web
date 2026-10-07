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
var briefcase_medical_exports = {};
__export(briefcase_medical_exports, {
  BriefcaseMedicalIcon: () => BriefcaseMedicalIcon
});
module.exports = __toCommonJS(briefcase_medical_exports);
var import_create_icon = require("../../create-icon.cjs");
const BriefcaseMedicalIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BriefcaseMedicalIcon", [["path", { "d": "M12 11v4" }], ["path", { "d": "M14 13h-4" }], ["path", { "d": "M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" }], ["path", { "d": "M18 6v14" }], ["path", { "d": "M6 6v14" }], ["rect", { "width": "20", "height": "14", "x": "2", "y": "6", "rx": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BriefcaseMedicalIcon
});

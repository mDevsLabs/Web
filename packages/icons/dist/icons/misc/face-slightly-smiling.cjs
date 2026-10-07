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
var face_slightly_smiling_exports = {};
__export(face_slightly_smiling_exports, {
  FaceSlightlySmilingIcon: () => FaceSlightlySmilingIcon
});
module.exports = __toCommonJS(face_slightly_smiling_exports);
var import_create_icon = require("../../create-icon.cjs");
const FaceSlightlySmilingIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("FaceSlightlySmilingIcon", [["path", { "d": "M15 10V9" }], ["path", { "d": "M16.472 15a6 6 0 01-8.943 0" }], ["path", { "d": "M9 10V9" }], ["circle", { "cx": "12", "cy": "12", "r": "10" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FaceSlightlySmilingIcon
});

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
var landmark_exports = {};
__export(landmark_exports, {
  LandmarkIcon: () => LandmarkIcon
});
module.exports = __toCommonJS(landmark_exports);
var import_create_icon = require("../../create-icon.cjs");
const LandmarkIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("LandmarkIcon", [["path", { "d": "M10 18v-7" }], ["path", { "d": "M11.119 2.205a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949z" }], ["path", { "d": "M14 18v-7" }], ["path", { "d": "M18 18v-7" }], ["path", { "d": "M3 22h18" }], ["path", { "d": "M6 18v-7" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LandmarkIcon
});

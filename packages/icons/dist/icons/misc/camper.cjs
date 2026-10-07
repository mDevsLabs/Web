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
var camper_exports = {};
__export(camper_exports, {
  CamperIcon: () => CamperIcon
});
module.exports = __toCommonJS(camper_exports);
var import_create_icon = require("../../create-icon.cjs");
const CamperIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CamperIcon", [["path", { "d": "M5 18a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" }], ["path", { "d": "M15 18a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" }], ["path", { "d": "M5 18h-1a1 1 0 0 1 -1 -1v-11a2 2 0 0 1 2 -2h12a4 4 0 0 1 4 4h-18" }], ["path", { "d": "M9 18h6" }], ["path", { "d": "M19 18h1a1 1 0 0 0 1 -1v-4l-3 -5" }], ["path", { "d": "M21 13h-7" }], ["path", { "d": "M14 8v10" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CamperIcon
});

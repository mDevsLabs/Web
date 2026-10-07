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
var camera_exclamation_exports = {};
__export(camera_exclamation_exports, {
  CameraExclamationIcon: () => CameraExclamationIcon
});
module.exports = __toCommonJS(camera_exclamation_exports);
var import_create_icon = require("../../create-icon.cjs");
const CameraExclamationIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CameraExclamationIcon", [["path", { "d": "M15 20h-10a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2h1a2 2 0 0 0 2 -2a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v3.5" }], ["path", { "d": "M9 13a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" }], ["path", { "d": "M19 16v3" }], ["path", { "d": "M19 22v.01" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CameraExclamationIcon
});

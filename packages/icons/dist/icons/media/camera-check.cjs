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
var camera_check_exports = {};
__export(camera_check_exports, {
  CameraCheckIcon: () => CameraCheckIcon
});
module.exports = __toCommonJS(camera_check_exports);
var import_create_icon = require("../../create-icon.cjs");
const CameraCheckIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CameraCheckIcon", [["path", { "d": "M11 20h-6a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2h1a2 2 0 0 0 2 -2a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v4" }], ["path", { "d": "M9 13a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" }], ["path", { "d": "M15 19l2 2l4 -4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CameraCheckIcon
});

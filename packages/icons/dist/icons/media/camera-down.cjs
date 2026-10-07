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
var camera_down_exports = {};
__export(camera_down_exports, {
  CameraDownIcon: () => CameraDownIcon
});
module.exports = __toCommonJS(camera_down_exports);
var import_create_icon = require("../../create-icon.cjs");
const CameraDownIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CameraDownIcon", [["path", { "d": "M12 20h-7a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2h1a2 2 0 0 0 2 -2a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v3.5" }], ["path", { "d": "M9 13a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" }], ["path", { "d": "M19 16v6" }], ["path", { "d": "M22 19l-3 3l-3 -3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CameraDownIcon
});

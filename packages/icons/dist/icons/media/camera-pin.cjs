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
var camera_pin_exports = {};
__export(camera_pin_exports, {
  CameraPinIcon: () => CameraPinIcon
});
module.exports = __toCommonJS(camera_pin_exports);
var import_create_icon = require("../../create-icon.cjs");
const CameraPinIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CameraPinIcon", [["path", { "d": "M12.5 20h-7.5a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2h1a2 2 0 0 0 2 -2a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v2" }], ["path", { "d": "M14.933 12.366a3.001 3.001 0 1 0 -2.933 3.634" }], ["path", { "d": "M21.121 20.121a3 3 0 1 0 -4.242 0c.418 .419 1.125 1.045 2.121 1.879c1.051 -.89 1.759 -1.516 2.121 -1.879" }], ["path", { "d": "M19 18v.01" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CameraPinIcon
});

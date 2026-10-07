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
var switch_camera_exports = {};
__export(switch_camera_exports, {
  SwitchCameraIcon: () => SwitchCameraIcon
});
module.exports = __toCommonJS(switch_camera_exports);
var import_create_icon = require("../../create-icon.cjs");
const SwitchCameraIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SwitchCameraIcon", [["path", { "d": "M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" }], ["path", { "d": "M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5" }], ["circle", { "cx": "12", "cy": "12", "r": "3" }], ["path", { "d": "m18 22-3-3 3-3" }], ["path", { "d": "m6 2 3 3-3 3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SwitchCameraIcon
});

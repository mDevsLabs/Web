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
var hard_drive_upload_exports = {};
__export(hard_drive_upload_exports, {
  HardDriveUploadIcon: () => HardDriveUploadIcon
});
module.exports = __toCommonJS(hard_drive_upload_exports);
var import_create_icon = require("../../create-icon.cjs");
const HardDriveUploadIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("HardDriveUploadIcon", [["path", { "d": "m16 6-4-4-4 4" }], ["path", { "d": "M12 2v8" }], ["rect", { "width": "20", "height": "8", "x": "2", "y": "14", "rx": "2" }], ["path", { "d": "M6 18h.01" }], ["path", { "d": "M10 18h.01" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HardDriveUploadIcon
});

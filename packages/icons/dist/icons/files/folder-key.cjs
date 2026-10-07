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
var folder_key_exports = {};
__export(folder_key_exports, {
  FolderKeyIcon: () => FolderKeyIcon
});
module.exports = __toCommonJS(folder_key_exports);
var import_create_icon = require("../../create-icon.cjs");
const FolderKeyIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("FolderKeyIcon", [["path", { "d": "M13 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v1.36" }], ["path", { "d": "M19 12v6" }], ["path", { "d": "M19 14h2" }], ["circle", { "cx": "19", "cy": "20", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FolderKeyIcon
});

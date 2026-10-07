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
var folder_lock_exports = {};
__export(folder_lock_exports, {
  FolderLockIcon: () => FolderLockIcon
});
module.exports = __toCommonJS(folder_lock_exports);
var import_create_icon = require("../../create-icon.cjs");
const FolderLockIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("FolderLockIcon", [["rect", { "width": "8", "height": "5", "x": "14", "y": "17", "rx": "1" }], ["path", { "d": "M10 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v2.5" }], ["path", { "d": "M20 17v-2a2 2 0 1 0-4 0v2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FolderLockIcon
});

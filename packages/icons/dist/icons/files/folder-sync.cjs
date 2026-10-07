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
var folder_sync_exports = {};
__export(folder_sync_exports, {
  FolderSyncIcon: () => FolderSyncIcon
});
module.exports = __toCommonJS(folder_sync_exports);
var import_create_icon = require("../../create-icon.cjs");
const FolderSyncIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("FolderSyncIcon", [["path", { "d": "M9 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v.5" }], ["path", { "d": "M12 10v4h4" }], ["path", { "d": "m12 14 1.535-1.605a5 5 0 0 1 8 1.5" }], ["path", { "d": "M22 22v-4h-4" }], ["path", { "d": "m22 18-1.535 1.605a5 5 0 0 1-8-1.5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FolderSyncIcon
});

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
var cloud_backup_exports = {};
__export(cloud_backup_exports, {
  CloudBackupIcon: () => CloudBackupIcon
});
module.exports = __toCommonJS(cloud_backup_exports);
var import_create_icon = require("../../create-icon.cjs");
const CloudBackupIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CloudBackupIcon", [["path", { "d": "M21 15.251A4.5 4.5 0 0 0 17.5 8h-1.79A7 7 0 1 0 3 13.607" }], ["path", { "d": "M7 11v4h4" }], ["path", { "d": "M8 19a5 5 0 0 0 9-3 4.5 4.5 0 0 0-4.5-4.5 4.82 4.82 0 0 0-3.41 1.41L7 15" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CloudBackupIcon
});

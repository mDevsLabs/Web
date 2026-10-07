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
var database_backup_exports = {};
__export(database_backup_exports, {
  DatabaseBackupIcon: () => DatabaseBackupIcon
});
module.exports = __toCommonJS(database_backup_exports);
var import_create_icon = require("../../create-icon.cjs");
const DatabaseBackupIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("DatabaseBackupIcon", [["ellipse", { "cx": "12", "cy": "5", "rx": "9", "ry": "3" }], ["path", { "d": "M3 12a9 3 0 0 0 5 2.69" }], ["path", { "d": "M21 9.3V5" }], ["path", { "d": "M3 5v14a9 3 0 0 0 6.47 2.88" }], ["path", { "d": "M12 12v4h4" }], ["path", { "d": "M13 20a5 5 0 0 0 9-3 4.5 4.5 0 0 0-4.5-4.5c-1.33 0-2.54.54-3.41 1.41L12 16" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DatabaseBackupIcon
});

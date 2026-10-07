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
var archive_restore_exports = {};
__export(archive_restore_exports, {
  ArchiveRestoreIcon: () => ArchiveRestoreIcon
});
module.exports = __toCommonJS(archive_restore_exports);
var import_create_icon = require("../../create-icon.cjs");
const ArchiveRestoreIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ArchiveRestoreIcon", [["rect", { "width": "20", "height": "5", "x": "2", "y": "3", "rx": "1" }], ["path", { "d": "M4 8v11a2 2 0 0 0 2 2h2" }], ["path", { "d": "M20 8v11a2 2 0 0 1-2 2h-2" }], ["path", { "d": "m9 15 3-3 3 3" }], ["path", { "d": "M12 12v9" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ArchiveRestoreIcon
});

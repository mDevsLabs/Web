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
var archive_exports = {};
__export(archive_exports, {
  ArchiveIcon: () => ArchiveIcon
});
module.exports = __toCommonJS(archive_exports);
var import_create_icon = require("../../create-icon.cjs");
const ArchiveIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ArchiveIcon", [["rect", { "width": "20", "height": "5", "x": "2", "y": "3", "rx": "1" }], ["path", { "d": "M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" }], ["path", { "d": "M10 12h4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ArchiveIcon
});

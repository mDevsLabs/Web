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
var file_box_exports = {};
__export(file_box_exports, {
  FileBoxIcon: () => FileBoxIcon
});
module.exports = __toCommonJS(file_box_exports);
var import_create_icon = require("../../create-icon.cjs");
const FileBoxIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("FileBoxIcon", [["path", { "d": "M14 2v5a1 1 0 001 1h5" }], ["path", { "d": "M14.692 22H18a2 2 0 002-2V8a2.4 2.4 0 00-.706-1.706l-3.588-3.588A2.4 2.4 0 0014 2H6a2 2 0 00-2 2v3.804" }], ["path", { "d": "M2.264 13.752 7 16.5l4.737-2.748" }], ["path", { "d": "M2.995 13.014A2 2 0 002 14.744v3.516a2 2 0 00.996 1.73l3 1.74a2 2 0 002.008 0l3-1.74A2 2 0 0012 18.26v-3.517a2 2 0 00-.995-1.73l-3-1.742a2 2 0 00-1.892-.064z" }], ["path", { "d": "M7 16.5V22" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FileBoxIcon
});

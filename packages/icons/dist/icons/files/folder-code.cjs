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
var folder_code_exports = {};
__export(folder_code_exports, {
  FolderCodeIcon: () => FolderCodeIcon
});
module.exports = __toCommonJS(folder_code_exports);
var import_create_icon = require("../../create-icon.cjs");
const FolderCodeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("FolderCodeIcon", [["path", { "d": "M10 10.5 8 13l2 2.5" }], ["path", { "d": "m14 10.5 2 2.5-2 2.5" }], ["path", { "d": "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FolderCodeIcon
});

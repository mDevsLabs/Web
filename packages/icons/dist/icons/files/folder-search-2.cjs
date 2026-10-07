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
var folder_search_2_exports = {};
__export(folder_search_2_exports, {
  FolderSearch2Icon: () => FolderSearch2Icon
});
module.exports = __toCommonJS(folder_search_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const FolderSearch2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("FolderSearch2Icon", [["circle", { "cx": "11.5", "cy": "12.5", "r": "2.5" }], ["path", { "d": "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" }], ["path", { "d": "M13.3 14.3 15 16" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FolderSearch2Icon
});

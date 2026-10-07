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
var folder_git_2_exports = {};
__export(folder_git_2_exports, {
  FolderGit2Icon: () => FolderGit2Icon
});
module.exports = __toCommonJS(folder_git_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const FolderGit2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("FolderGit2Icon", [["path", { "d": "M18 19a5 5 0 0 1-5-5v8" }], ["path", { "d": "M9 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v5" }], ["circle", { "cx": "13", "cy": "12", "r": "2" }], ["circle", { "cx": "20", "cy": "19", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FolderGit2Icon
});

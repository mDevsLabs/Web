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
var folder_root_exports = {};
__export(folder_root_exports, {
  FolderRootIcon: () => FolderRootIcon
});
module.exports = __toCommonJS(folder_root_exports);
var import_create_icon = require("../../create-icon.cjs");
const FolderRootIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("FolderRootIcon", [["path", { "d": "M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" }], ["circle", { "cx": "12", "cy": "13", "r": "2" }], ["path", { "d": "M12 15v5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FolderRootIcon
});

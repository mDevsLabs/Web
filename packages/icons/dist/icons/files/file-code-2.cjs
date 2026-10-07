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
var file_code_2_exports = {};
__export(file_code_2_exports, {
  FileCode2Icon: () => FileCode2Icon
});
module.exports = __toCommonJS(file_code_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const FileCode2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("FileCode2Icon", [["path", { "d": "M4 12.15V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2h-3.35" }], ["path", { "d": "M14 2v5a1 1 0 0 0 1 1h5" }], ["path", { "d": "m5 16-3 3 3 3" }], ["path", { "d": "m9 22 3-3-3-3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FileCode2Icon
});

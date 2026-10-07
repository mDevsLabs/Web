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
var file_lock_2_exports = {};
__export(file_lock_2_exports, {
  FileLock2Icon: () => FileLock2Icon
});
module.exports = __toCommonJS(file_lock_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const FileLock2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("FileLock2Icon", [["path", { "d": "M4 9.8V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2h-3" }], ["path", { "d": "M14 2v5a1 1 0 0 0 1 1h5" }], ["path", { "d": "M9 17v-2a2 2 0 0 0-4 0v2" }], ["rect", { "width": "8", "height": "5", "x": "3", "y": "17", "rx": "1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FileLock2Icon
});

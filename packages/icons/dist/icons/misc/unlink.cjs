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
var unlink_exports = {};
__export(unlink_exports, {
  UnlinkIcon: () => UnlinkIcon
});
module.exports = __toCommonJS(unlink_exports);
var import_create_icon = require("../../create-icon.cjs");
const UnlinkIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("UnlinkIcon", [["path", { "d": "m18.84 12.25 1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71" }], ["path", { "d": "m5.17 11.75-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71" }], ["line", { "x1": "8", "x2": "8", "y1": "2", "y2": "5" }], ["line", { "x1": "2", "x2": "5", "y1": "8", "y2": "8" }], ["line", { "x1": "16", "x2": "16", "y1": "19", "y2": "22" }], ["line", { "x1": "19", "x2": "22", "y1": "16", "y2": "16" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  UnlinkIcon
});

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
var download_exports = {};
__export(download_exports, {
  DownloadIcon: () => DownloadIcon
});
module.exports = __toCommonJS(download_exports);
var import_create_icon = require("../../create-icon.cjs");
const DownloadIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("DownloadIcon", [["path", { "d": "M12 15V3" }], ["path", { "d": "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }], ["path", { "d": "m7 10 5 5 5-5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DownloadIcon
});

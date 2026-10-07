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
var book_download_exports = {};
__export(book_download_exports, {
  BookDownloadIcon: () => BookDownloadIcon
});
module.exports = __toCommonJS(book_download_exports);
var import_create_icon = require("../../create-icon.cjs");
const BookDownloadIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BookDownloadIcon", [["path", { "d": "M12 20h-6a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12v5" }], ["path", { "d": "M13 16h-7a2 2 0 0 0 -2 2" }], ["path", { "d": "M15 19l3 3l3 -3" }], ["path", { "d": "M18 22v-9" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BookDownloadIcon
});

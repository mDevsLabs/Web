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
var bookmarks_off_exports = {};
__export(bookmarks_off_exports, {
  BookmarksOffIcon: () => BookmarksOffIcon
});
module.exports = __toCommonJS(bookmarks_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const BookmarksOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BookmarksOffIcon", [["path", { "d": "M11 7h2a2 2 0 0 1 2 2v2m0 4v6l-5 -3l-5 3v-12a2 2 0 0 1 2 -2" }], ["path", { "d": "M9.265 4a2 2 0 0 1 1.735 -1h6a2 2 0 0 1 2 2v10" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BookmarksOffIcon
});

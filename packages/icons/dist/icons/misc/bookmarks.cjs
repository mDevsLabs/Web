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
var bookmarks_exports = {};
__export(bookmarks_exports, {
  BookmarksIcon: () => BookmarksIcon
});
module.exports = __toCommonJS(bookmarks_exports);
var import_create_icon = require("../../create-icon.cjs");
const BookmarksIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BookmarksIcon", [["path", { "d": "M15 10v11l-5 -3l-5 3v-11a3 3 0 0 1 3 -3h4a3 3 0 0 1 3 3" }], ["path", { "d": "M11 3h5a3 3 0 0 1 3 3v11" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BookmarksIcon
});

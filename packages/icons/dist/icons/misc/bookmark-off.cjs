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
var bookmark_off_exports = {};
__export(bookmark_off_exports, {
  BookmarkOffIcon: () => BookmarkOffIcon
});
module.exports = __toCommonJS(bookmark_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const BookmarkOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BookmarkOffIcon", [["path", { "d": "M19 19v1a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5" }], ["path", { "d": "m2 2 20 20" }], ["path", { "d": "M8.656 3H17a2 2 0 0 1 2 2v8.344" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BookmarkOffIcon
});

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
var bookmark_ai_exports = {};
__export(bookmark_ai_exports, {
  BookmarkAiIcon: () => BookmarkAiIcon
});
module.exports = __toCommonJS(bookmark_ai_exports);
var import_create_icon = require("../../create-icon.cjs");
const BookmarkAiIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BookmarkAiIcon", [["path", { "d": "M10.02 18.32l-4.02 2.68v-14a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v4.5" }], ["path", { "d": "M14 21v-4a2 2 0 1 1 4 0v4" }], ["path", { "d": "M14 19h4" }], ["path", { "d": "M21 15v6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BookmarkAiIcon
});

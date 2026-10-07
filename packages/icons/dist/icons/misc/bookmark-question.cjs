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
var bookmark_question_exports = {};
__export(bookmark_question_exports, {
  BookmarkQuestionIcon: () => BookmarkQuestionIcon
});
module.exports = __toCommonJS(bookmark_question_exports);
var import_create_icon = require("../../create-icon.cjs");
const BookmarkQuestionIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BookmarkQuestionIcon", [["path", { "d": "M15 19l-3 -2l-6 4v-14a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v4" }], ["path", { "d": "M19 22v.01" }], ["path", { "d": "M19 19a2.003 2.003 0 0 0 .914 -3.782a1.98 1.98 0 0 0 -2.414 .483" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BookmarkQuestionIcon
});

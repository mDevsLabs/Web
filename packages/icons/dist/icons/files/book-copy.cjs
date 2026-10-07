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
var book_copy_exports = {};
__export(book_copy_exports, {
  BookCopyIcon: () => BookCopyIcon
});
module.exports = __toCommonJS(book_copy_exports);
var import_create_icon = require("../../create-icon.cjs");
const BookCopyIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BookCopyIcon", [["path", { "d": "M5 7a2 2 0 0 0-2 2v11" }], ["path", { "d": "M5.803 18H5a2 2 0 0 0 0 4h9.5a.5.5 0 0 0 .5-.5V21" }], ["path", { "d": "M9 15V4a2 2 0 0 1 2-2h9.5a.5.5 0 0 1 .5.5v14a.5.5 0 0 1-.5.5H11a2 2 0 0 1 0-4h10" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BookCopyIcon
});

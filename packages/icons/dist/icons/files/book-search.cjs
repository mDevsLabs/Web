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
var book_search_exports = {};
__export(book_search_exports, {
  BookSearchIcon: () => BookSearchIcon
});
module.exports = __toCommonJS(book_search_exports);
var import_create_icon = require("../../create-icon.cjs");
const BookSearchIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BookSearchIcon", [["path", { "d": "M11 22H5.5a1 1 0 0 1 0-5h4.501" }], ["path", { "d": "m21 22-1.879-1.878" }], ["path", { "d": "M3 19.5v-15A2.5 2.5 0 0 1 5.5 2H18a1 1 0 0 1 1 1v8" }], ["circle", { "cx": "17", "cy": "18", "r": "3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BookSearchIcon
});

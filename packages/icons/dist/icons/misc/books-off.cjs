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
var books_off_exports = {};
__export(books_off_exports, {
  BooksOffIcon: () => BooksOffIcon
});
module.exports = __toCommonJS(books_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const BooksOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BooksOffIcon", [["path", { "d": "M9 9v10a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-14" }], ["path", { "d": "M8 4a1 1 0 0 1 1 1" }], ["path", { "d": "M9 5a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v4" }], ["path", { "d": "M13 13v6a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-10" }], ["path", { "d": "M5 8h3" }], ["path", { "d": "M9 16h4" }], ["path", { "d": "M14.254 10.244l-1.218 -4.424a1.02 1.02 0 0 1 .634 -1.219l.133 -.041l2.184 -.53c.562 -.135 1.133 .19 1.282 .732l3.236 11.75" }], ["path", { "d": "M19.585 19.589l-1.572 .38c-.562 .136 -1.133 -.19 -1.282 -.731l-.952 -3.458" }], ["path", { "d": "M14 9l4 -1" }], ["path", { "d": "M19.207 15.199l.716 -.18" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BooksOffIcon
});

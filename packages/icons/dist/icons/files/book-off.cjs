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
var book_off_exports = {};
__export(book_off_exports, {
  BookOffIcon: () => BookOffIcon
});
module.exports = __toCommonJS(book_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const BookOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BookOffIcon", [["path", { "d": "M3 19a9 9 0 0 1 9 0a9 9 0 0 1 5.899 -1.096" }], ["path", { "d": "M3 6a9 9 0 0 1 2.114 -.884m3.8 -.21c1.07 .17 2.116 .534 3.086 1.094a9 9 0 0 1 9 0" }], ["path", { "d": "M3 6v13" }], ["path", { "d": "M12 6v2m0 4v7" }], ["path", { "d": "M21 6v11" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BookOffIcon
});

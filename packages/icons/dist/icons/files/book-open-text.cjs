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
var book_open_text_exports = {};
__export(book_open_text_exports, {
  BookOpenTextIcon: () => BookOpenTextIcon
});
module.exports = __toCommonJS(book_open_text_exports);
var import_create_icon = require("../../create-icon.cjs");
const BookOpenTextIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BookOpenTextIcon", [["path", { "d": "M12 5v16" }], ["path", { "d": "M16 13h2" }], ["path", { "d": "M16 9h2" }], ["path", { "d": "M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z" }], ["path", { "d": "M6 13h2" }], ["path", { "d": "M6 9h2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BookOpenTextIcon
});

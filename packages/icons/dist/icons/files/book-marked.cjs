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
var book_marked_exports = {};
__export(book_marked_exports, {
  BookMarkedIcon: () => BookMarkedIcon
});
module.exports = __toCommonJS(book_marked_exports);
var import_create_icon = require("../../create-icon.js");
const BookMarkedIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BookMarkedIcon", [
  ["path", { d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" }],
  ["path", { d: "M10 2v8l3-3 3 3V2" }]
]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BookMarkedIcon
});

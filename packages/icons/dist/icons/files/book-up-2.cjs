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
var book_up_2_exports = {};
__export(book_up_2_exports, {
  BookUp2Icon: () => BookUp2Icon
});
module.exports = __toCommonJS(book_up_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const BookUp2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BookUp2Icon", [["path", { "d": "M12 13V7" }], ["path", { "d": "M18 2h1a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" }], ["path", { "d": "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2" }], ["path", { "d": "m9 10 3-3 3 3" }], ["path", { "d": "m9 5 3-3 3 3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BookUp2Icon
});

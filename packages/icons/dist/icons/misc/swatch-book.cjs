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
var swatch_book_exports = {};
__export(swatch_book_exports, {
  SwatchBookIcon: () => SwatchBookIcon
});
module.exports = __toCommonJS(swatch_book_exports);
var import_create_icon = require("../../create-icon.cjs");
const SwatchBookIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SwatchBookIcon", [["path", { "d": "M11 17a4 4 0 0 1-8 0V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2Z" }], ["path", { "d": "M16.7 13H19a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H7" }], ["path", { "d": "M 7 17h.01" }], ["path", { "d": "m11 8 2.3-2.3a2.4 2.4 0 0 1 3.404.004L18.6 7.6a2.4 2.4 0 0 1 .026 3.434L9.9 19.8" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SwatchBookIcon
});

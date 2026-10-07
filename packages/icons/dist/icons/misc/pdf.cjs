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
var pdf_exports = {};
__export(pdf_exports, {
  PdfIcon: () => PdfIcon
});
module.exports = __toCommonJS(pdf_exports);
var import_create_icon = require("../../create-icon.cjs");
const PdfIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("PdfIcon", [["path", { "d": "M10 8v8h2a2 2 0 0 0 2 -2v-4a2 2 0 0 0 -2 -2h-2" }], ["path", { "d": "M3 12h2a2 2 0 1 0 0 -4h-2v8" }], ["path", { "d": "M17 12h3" }], ["path", { "d": "M21 8h-4v8" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PdfIcon
});

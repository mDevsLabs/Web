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
var letter_text_exports = {};
__export(letter_text_exports, {
  LetterTextIcon: () => LetterTextIcon
});
module.exports = __toCommonJS(letter_text_exports);
var import_create_icon = require("../../create-icon.cjs");
const LetterTextIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("LetterTextIcon", [["path", { "d": "M15 5h6" }], ["path", { "d": "M15 12h6" }], ["path", { "d": "M3 19h18" }], ["path", { "d": "m3 12 3.553-7.724a.5.5 0 0 1 .894 0L11 12" }], ["path", { "d": "M3.92 10h6.16" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LetterTextIcon
});

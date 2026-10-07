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
var letter_g_small_exports = {};
__export(letter_g_small_exports, {
  LetterGSmallIcon: () => LetterGSmallIcon
});
module.exports = __toCommonJS(letter_g_small_exports);
var import_create_icon = require("../../create-icon.cjs");
const LetterGSmallIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("LetterGSmallIcon", [["path", { "d": "M14 8h-2a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h2v-4h-1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LetterGSmallIcon
});

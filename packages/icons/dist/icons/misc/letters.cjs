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
var letters_exports = {};
__export(letters_exports, {
  LettersIcon: () => LettersIcon
});
module.exports = __toCommonJS(letters_exports);
var import_create_icon = require("../../create-icon.cjs");
const LettersIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("LettersIcon", [["path", { "d": "M15 8H9" }], ["path", { "d": "M21 15.354a4 4 0 100 5.292" }], ["path", { "d": "M3 18h4a2 2 0 010 4H3.5a.5.5 0 01-.5-.5v-7a.5.5 0 01.5-.5H6a2 2 0 010 4" }], ["path", { "d": "m8 10 3.453-7.648a.6.6 0 011.094 0L16 10" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LettersIcon
});

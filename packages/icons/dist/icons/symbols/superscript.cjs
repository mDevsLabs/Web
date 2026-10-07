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
var superscript_exports = {};
__export(superscript_exports, {
  SuperscriptIcon: () => SuperscriptIcon
});
module.exports = __toCommonJS(superscript_exports);
var import_create_icon = require("../../create-icon.cjs");
const SuperscriptIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SuperscriptIcon", [["path", { "d": "m4 19 8-8" }], ["path", { "d": "m12 19-8-8" }], ["path", { "d": "M20 12h-4c0-1.5.442-2 1.5-2.5S20 8.334 20 7.002c0-.472-.17-.93-.484-1.29a2.105 2.105 0 0 0-2.617-.436c-.42.239-.738.614-.899 1.06" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SuperscriptIcon
});

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
var remove_formatting_exports = {};
__export(remove_formatting_exports, {
  RemoveFormattingIcon: () => RemoveFormattingIcon
});
module.exports = __toCommonJS(remove_formatting_exports);
var import_create_icon = require("../../create-icon.cjs");
const RemoveFormattingIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("RemoveFormattingIcon", [["path", { "d": "M4 7V4h16v3" }], ["path", { "d": "M5 20h6" }], ["path", { "d": "M13 4 8 20" }], ["path", { "d": "m15 15 5 5" }], ["path", { "d": "m20 15-5 5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RemoveFormattingIcon
});

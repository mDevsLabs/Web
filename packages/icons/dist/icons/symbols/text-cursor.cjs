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
var text_cursor_exports = {};
__export(text_cursor_exports, {
  TextCursorIcon: () => TextCursorIcon
});
module.exports = __toCommonJS(text_cursor_exports);
var import_create_icon = require("../../create-icon.cjs");
const TextCursorIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("TextCursorIcon", [["path", { "d": "M17 22h-1a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4h1" }], ["path", { "d": "M7 22h1a4 4 0 0 0 4-4" }], ["path", { "d": "M7 2h1a4 4 0 0 1 4 4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TextCursorIcon
});

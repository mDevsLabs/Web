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
var text_cursor_input_exports = {};
__export(text_cursor_input_exports, {
  TextCursorInputIcon: () => TextCursorInputIcon
});
module.exports = __toCommonJS(text_cursor_input_exports);
var import_create_icon = require("../../create-icon.cjs");
const TextCursorInputIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("TextCursorInputIcon", [["path", { "d": "M12 20h-1a2 2 0 0 1-2-2 2 2 0 0 1-2 2H6" }], ["path", { "d": "M13 8h7a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-7" }], ["path", { "d": "M5 16H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h1" }], ["path", { "d": "M6 4h1a2 2 0 0 1 2 2 2 2 0 0 1 2-2h1" }], ["path", { "d": "M9 6v12" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TextCursorInputIcon
});

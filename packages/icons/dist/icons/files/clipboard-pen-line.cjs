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
var clipboard_pen_line_exports = {};
__export(clipboard_pen_line_exports, {
  ClipboardPenLineIcon: () => ClipboardPenLineIcon
});
module.exports = __toCommonJS(clipboard_pen_line_exports);
var import_create_icon = require("../../create-icon.cjs");
const ClipboardPenLineIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ClipboardPenLineIcon", [["rect", { "width": "8", "height": "4", "x": "8", "y": "2", "rx": "1" }], ["path", { "d": "M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-.5" }], ["path", { "d": "M16 4h2a2 2 0 0 1 1.73 1" }], ["path", { "d": "M8 18h1" }], ["path", { "d": "M21.378 12.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ClipboardPenLineIcon
});

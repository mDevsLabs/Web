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
var clipboard_paste_exports = {};
__export(clipboard_paste_exports, {
  ClipboardPasteIcon: () => ClipboardPasteIcon
});
module.exports = __toCommonJS(clipboard_paste_exports);
var import_create_icon = require("../../create-icon.cjs");
const ClipboardPasteIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ClipboardPasteIcon", [["path", { "d": "M11 14h10" }], ["path", { "d": "M16 4h2a2 2 0 0 1 2 2v1.344" }], ["path", { "d": "m17 18 4-4-4-4" }], ["path", { "d": "M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 1.793-1.113" }], ["rect", { "x": "8", "y": "2", "width": "8", "height": "4", "rx": "1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ClipboardPasteIcon
});

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
var sticky_note_minus_exports = {};
__export(sticky_note_minus_exports, {
  StickyNoteMinusIcon: () => StickyNoteMinusIcon
});
module.exports = __toCommonJS(sticky_note_minus_exports);
var import_create_icon = require("../../create-icon.cjs");
const StickyNoteMinusIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("StickyNoteMinusIcon", [["path", { "d": "M15 3v5a1 1 0 0 0 1 1h5" }], ["path", { "d": "M21 14V9a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 15 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7.35" }], ["path", { "d": "M21 18h-6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  StickyNoteMinusIcon
});

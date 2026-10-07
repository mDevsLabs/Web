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
var notepad_text_dashed_exports = {};
__export(notepad_text_dashed_exports, {
  NotepadTextDashedIcon: () => NotepadTextDashedIcon
});
module.exports = __toCommonJS(notepad_text_dashed_exports);
var import_create_icon = require("../../create-icon.cjs");
const NotepadTextDashedIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("NotepadTextDashedIcon", [["path", { "d": "M8 2v4" }], ["path", { "d": "M12 2v4" }], ["path", { "d": "M16 2v4" }], ["path", { "d": "M16 4h2a2 2 0 0 1 2 2v2" }], ["path", { "d": "M20 12v2" }], ["path", { "d": "M20 18v2a2 2 0 0 1-2 2h-1" }], ["path", { "d": "M13 22h-2" }], ["path", { "d": "M7 22H6a2 2 0 0 1-2-2v-2" }], ["path", { "d": "M4 14v-2" }], ["path", { "d": "M4 8V6a2 2 0 0 1 2-2h2" }], ["path", { "d": "M8 10h6" }], ["path", { "d": "M8 14h8" }], ["path", { "d": "M8 18h5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  NotepadTextDashedIcon
});

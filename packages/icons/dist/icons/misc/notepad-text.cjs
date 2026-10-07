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
var notepad_text_exports = {};
__export(notepad_text_exports, {
  NotepadTextIcon: () => NotepadTextIcon
});
module.exports = __toCommonJS(notepad_text_exports);
var import_create_icon = require("../../create-icon.cjs");
const NotepadTextIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("NotepadTextIcon", [["path", { "d": "M8 2v4" }], ["path", { "d": "M12 2v4" }], ["path", { "d": "M16 2v4" }], ["rect", { "width": "16", "height": "18", "x": "4", "y": "4", "rx": "2" }], ["path", { "d": "M8 10h6" }], ["path", { "d": "M8 14h8" }], ["path", { "d": "M8 18h5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  NotepadTextIcon
});

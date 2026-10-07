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
var sticky_note_off_exports = {};
__export(sticky_note_off_exports, {
  StickyNoteOffIcon: () => StickyNoteOffIcon
});
module.exports = __toCommonJS(sticky_note_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const StickyNoteOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("StickyNoteOffIcon", [["path", { "d": "M15 3v5a1 1 0 0 0 1 1h5" }], ["path", { "d": "m2 2 20 20" }], ["path", { "d": "M3.586 3.586A2 2 0 0 0 3 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 1.414-.586" }], ["path", { "d": "M8.656 3H15a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 21 9v6.344" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  StickyNoteOffIcon
});

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
var sticky_notes_exports = {};
__export(sticky_notes_exports, {
  StickyNotesIcon: () => StickyNotesIcon
});
module.exports = __toCommonJS(sticky_notes_exports);
var import_create_icon = require("../../create-icon.cjs");
const StickyNotesIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("StickyNotesIcon", [["path", { "d": "M10 8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 16 14v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z" }], ["path", { "d": "M10 8v5a1 1 0 0 0 1 1h5" }], ["path", { "d": "M8 4a2 2 0 0 1 2-2h6a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 22 8v6a2 2 0 0 1-2 2" }], ["path", { "d": "M16 2v5a1 1 0 0 0 1 1h5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  StickyNotesIcon
});

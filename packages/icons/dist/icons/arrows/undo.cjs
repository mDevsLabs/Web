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
var undo_exports = {};
__export(undo_exports, {
  UndoIcon: () => UndoIcon
});
module.exports = __toCommonJS(undo_exports);
var import_create_icon = require("../../create-icon.cjs");
const UndoIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("UndoIcon", [["path", { "d": "M3 7v6h6" }], ["path", { "d": "M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  UndoIcon
});

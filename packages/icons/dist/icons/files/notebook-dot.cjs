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
var notebook_dot_exports = {};
__export(notebook_dot_exports, {
  NotebookDotIcon: () => NotebookDotIcon
});
module.exports = __toCommonJS(notebook_dot_exports);
var import_create_icon = require("../../create-icon.cjs");
const NotebookDotIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("NotebookDotIcon", [["path", { "d": "M16 11.75V22" }], ["path", { "d": "M2 10h4" }], ["path", { "d": "M2 14h4" }], ["path", { "d": "M2 18h4" }], ["path", { "d": "M2 6h4" }], ["path", { "d": "M20 11.75V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h5.65" }], ["circle", { "cx": "18", "cy": "5", "r": "3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  NotebookDotIcon
});

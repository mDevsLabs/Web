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
var notebook_pen_exports = {};
__export(notebook_pen_exports, {
  NotebookPenIcon: () => NotebookPenIcon
});
module.exports = __toCommonJS(notebook_pen_exports);
var import_create_icon = require("../../create-icon.cjs");
const NotebookPenIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("NotebookPenIcon", [["path", { "d": "M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4" }], ["path", { "d": "M2 6h4" }], ["path", { "d": "M2 10h4" }], ["path", { "d": "M2 14h4" }], ["path", { "d": "M2 18h4" }], ["path", { "d": "M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  NotebookPenIcon
});

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
var pencil_sparkles_exports = {};
__export(pencil_sparkles_exports, {
  PencilSparklesIcon: () => PencilSparklesIcon
});
module.exports = __toCommonJS(pencil_sparkles_exports);
var import_create_icon = require("../../create-icon.cjs");
const PencilSparklesIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("PencilSparklesIcon", [["path", { "d": "M10 3H8" }], ["path", { "d": "m15.007 5.008 3.987 3.986" }], ["path", { "d": "M20 15v4" }], ["path", { "d": "M21.174 6.813a2.82 2.82 0 0 0-3.986-3.987L3.842 16.175a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" }], ["path", { "d": "M22 17h-4" }], ["path", { "d": "M4 5v4" }], ["path", { "d": "M6 7H2" }], ["path", { "d": "M9 2v2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PencilSparklesIcon
});

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
var clef_alto_exports = {};
__export(clef_alto_exports, {
  ClefAltoIcon: () => ClefAltoIcon
});
module.exports = __toCommonJS(clef_alto_exports);
var import_create_icon = require("../../create-icon.cjs");
const ClefAltoIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ClefAltoIcon", [["path", { "d": "M10 4v16" }], ["path", { "d": "M14 4.764a3 3 0 1 1-.152 4.327A4 4 0 0 1 10 12a4 4 0 0 1 3.848 2.909A3 3 0 1 1 14 19.236" }], ["path", { "d": "M6 4v16" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ClefAltoIcon
});

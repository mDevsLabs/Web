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
var svg_exports = {};
__export(svg_exports, {
  SvgIcon: () => SvgIcon
});
module.exports = __toCommonJS(svg_exports);
var import_create_icon = require("../../create-icon.cjs");
const SvgIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SvgIcon", [["path", { "d": "M21 8h-2a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h2v-4h-1" }], ["path", { "d": "M7 8h-3a1 1 0 0 0 -1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-3" }], ["path", { "d": "M10 8l1.5 8h1l1.5 -8" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SvgIcon
});

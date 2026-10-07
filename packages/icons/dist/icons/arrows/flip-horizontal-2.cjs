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
var flip_horizontal_2_exports = {};
__export(flip_horizontal_2_exports, {
  FlipHorizontal2Icon: () => FlipHorizontal2Icon
});
module.exports = __toCommonJS(flip_horizontal_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const FlipHorizontal2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("FlipHorizontal2Icon", [["path", { "d": "M10 12H8" }], ["path", { "d": "M16 12h-2" }], ["path", { "d": "M22 12h-2" }], ["path", { "d": "M4 12H2" }], ["path", { "d": "M7.298 20.288A1 1 0 008 22h8a1 1 0 00.703-1.712l-3.991-3.99a1 1 0 00-1.424-.001z" }], ["path", { "d": "M7.298 3.712A1 1 0 018 2h8a1 1 0 01.703 1.712l-3.991 3.99a1 1 0 01-1.424.001z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FlipHorizontal2Icon
});

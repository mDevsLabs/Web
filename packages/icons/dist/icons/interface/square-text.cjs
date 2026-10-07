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
var square_text_exports = {};
__export(square_text_exports, {
  SquareTextIcon: () => SquareTextIcon
});
module.exports = __toCommonJS(square_text_exports);
var import_create_icon = require("../../create-icon.cjs");
const SquareTextIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SquareTextIcon", [["rect", { "width": "18", "height": "18", "x": "3", "y": "3", "rx": "2" }], ["path", { "d": "M7 8h8" }], ["path", { "d": "M7 12h10" }], ["path", { "d": "M7 16h6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SquareTextIcon
});

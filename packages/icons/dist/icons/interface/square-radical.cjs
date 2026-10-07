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
var square_radical_exports = {};
__export(square_radical_exports, {
  SquareRadicalIcon: () => SquareRadicalIcon
});
module.exports = __toCommonJS(square_radical_exports);
var import_create_icon = require("../../create-icon.cjs");
const SquareRadicalIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SquareRadicalIcon", [["path", { "d": "M7 12h2l2 5 2-10h4" }], ["rect", { "x": "3", "y": "3", "width": "18", "height": "18", "rx": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SquareRadicalIcon
});

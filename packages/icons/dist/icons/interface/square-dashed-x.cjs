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
var square_dashed_x_exports = {};
__export(square_dashed_x_exports, {
  SquareDashedXIcon: () => SquareDashedXIcon
});
module.exports = __toCommonJS(square_dashed_x_exports);
var import_create_icon = require("../../create-icon.cjs");
const SquareDashedXIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SquareDashedXIcon", [["path", { "d": "M14 21h1" }], ["path", { "d": "M14 3h1" }], ["path", { "d": "M19 3a2 2 0 012 2" }], ["path", { "d": "M21 14v1" }], ["path", { "d": "M21 19a2 2 0 01-2 2" }], ["path", { "d": "M21 9v1" }], ["path", { "d": "M3 14v1" }], ["path", { "d": "M3 9v1" }], ["path", { "d": "M5 21a2 2 0 01-2-2" }], ["path", { "d": "M5 3a2 2 0 00-2 2" }], ["path", { "d": "m9 15 6-6" }], ["path", { "d": "M9 21h1" }], ["path", { "d": "M9 3h1" }], ["path", { "d": "m9 9 6 6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SquareDashedXIcon
});

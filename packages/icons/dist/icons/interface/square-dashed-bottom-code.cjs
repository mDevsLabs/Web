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
var square_dashed_bottom_code_exports = {};
__export(square_dashed_bottom_code_exports, {
  SquareDashedBottomCodeIcon: () => SquareDashedBottomCodeIcon
});
module.exports = __toCommonJS(square_dashed_bottom_code_exports);
var import_create_icon = require("../../create-icon.cjs");
const SquareDashedBottomCodeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SquareDashedBottomCodeIcon", [["path", { "d": "M10 9.5 8 12l2 2.5" }], ["path", { "d": "M14 21h1" }], ["path", { "d": "m14 9.5 2 2.5-2 2.5" }], ["path", { "d": "M5 21a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2" }], ["path", { "d": "M9 21h1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SquareDashedBottomCodeIcon
});

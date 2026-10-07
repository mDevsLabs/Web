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
var square_arrow_right_enter_exports = {};
__export(square_arrow_right_enter_exports, {
  SquareArrowRightEnterIcon: () => SquareArrowRightEnterIcon
});
module.exports = __toCommonJS(square_arrow_right_enter_exports);
var import_create_icon = require("../../create-icon.cjs");
const SquareArrowRightEnterIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SquareArrowRightEnterIcon", [["path", { "d": "m10 16 4-4-4-4" }], ["path", { "d": "M3 12h11" }], ["path", { "d": "M3 8V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SquareArrowRightEnterIcon
});

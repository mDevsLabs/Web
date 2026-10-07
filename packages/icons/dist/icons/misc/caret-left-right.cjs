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
var caret_left_right_exports = {};
__export(caret_left_right_exports, {
  CaretLeftRightIcon: () => CaretLeftRightIcon
});
module.exports = __toCommonJS(caret_left_right_exports);
var import_create_icon = require("../../create-icon.cjs");
const CaretLeftRightIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CaretLeftRightIcon", [["path", { "d": "M14 18l6 -6l-6 -6v12" }], ["path", { "d": "M10 18l-6 -6l6 -6v12" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CaretLeftRightIcon
});

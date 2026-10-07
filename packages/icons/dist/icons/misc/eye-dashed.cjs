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
var eye_dashed_exports = {};
__export(eye_dashed_exports, {
  EyeDashedIcon: () => EyeDashedIcon
});
module.exports = __toCommonJS(eye_dashed_exports);
var import_create_icon = require("../../create-icon.cjs");
const EyeDashedIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("EyeDashedIcon", [["path", { "d": "M13.054 18.946a11 11 0 0 1-2.11 0" }], ["path", { "d": "M13.054 5.054a11 11 0 0 0-2.11-.001" }], ["path", { "d": "M17.072 6.274a11 11 0 0 1 1.753 1.173" }], ["path", { "d": "M18.825 16.552a11 11 0 0 1-1.753 1.174" }], ["path", { "d": "M2.514 13.303a11 11 0 0 1-.452-.954 1 1 0 0 1 0-.697 11 11 0 0 1 .45-.955" }], ["path", { "d": "M21.485 10.697a11 11 0 0 1 .453.955 1 1 0 0 1 0 .697 11 11 0 0 1-.453.954" }], ["path", { "d": "M5.173 7.448a11 11 0 0 1 1.753-1.174" }], ["path", { "d": "M6.926 17.726a11 11 0 0 1-1.753-1.174" }], ["circle", { "cx": "12", "cy": "12", "r": "3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EyeDashedIcon
});

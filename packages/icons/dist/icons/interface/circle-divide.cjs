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
var circle_divide_exports = {};
__export(circle_divide_exports, {
  CircleDivideIcon: () => CircleDivideIcon
});
module.exports = __toCommonJS(circle_divide_exports);
var import_create_icon = require("../../create-icon.cjs");
const CircleDivideIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CircleDivideIcon", [["circle", { "cx": "12", "cy": "12", "r": "10" }], ["line", { "x1": "8", "x2": "16", "y1": "12", "y2": "12" }], ["line", { "x1": "12", "x2": "12", "y1": "16", "y2": "16" }], ["line", { "x1": "12", "x2": "12", "y1": "8", "y2": "8" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CircleDivideIcon
});

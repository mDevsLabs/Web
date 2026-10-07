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
var pound_sterling_exports = {};
__export(pound_sterling_exports, {
  PoundSterlingIcon: () => PoundSterlingIcon
});
module.exports = __toCommonJS(pound_sterling_exports);
var import_create_icon = require("../../create-icon.cjs");
const PoundSterlingIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("PoundSterlingIcon", [["path", { "d": "M18 7c0-5.333-8-5.333-8 0" }], ["path", { "d": "M10 7v14" }], ["path", { "d": "M6 21h12" }], ["path", { "d": "M6 13h10" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PoundSterlingIcon
});

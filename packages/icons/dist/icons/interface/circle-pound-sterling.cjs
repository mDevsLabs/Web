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
var circle_pound_sterling_exports = {};
__export(circle_pound_sterling_exports, {
  CirclePoundSterlingIcon: () => CirclePoundSterlingIcon
});
module.exports = __toCommonJS(circle_pound_sterling_exports);
var import_create_icon = require("../../create-icon.cjs");
const CirclePoundSterlingIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CirclePoundSterlingIcon", [["circle", { "cx": "12", "cy": "12", "r": "10" }], ["path", { "d": "M10 16V9.5a1 1 0 0 1 5 0" }], ["path", { "d": "M8 12h4" }], ["path", { "d": "M8 16h7" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CirclePoundSterlingIcon
});

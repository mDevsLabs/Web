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
var binary_off_exports = {};
__export(binary_off_exports, {
  BinaryOffIcon: () => BinaryOffIcon
});
module.exports = __toCommonJS(binary_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const BinaryOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BinaryOffIcon", [["path", { "d": "M11 7v-2h-1" }], ["path", { "d": "M18 19v-1" }], ["path", { "d": "M15.5 5h2a.5 .5 0 0 1 .5 .5v4a.5 .5 0 0 1 -.5 .5h-2a.5 .5 0 0 1 -.5 -.5v-4a.5 .5 0 0 1 .5 -.5" }], ["path", { "d": "M10.5 14h2a.5 .5 0 0 1 .5 .5v4a.5 .5 0 0 1 -.5 .5h-2a.5 .5 0 0 1 -.5 -.5v-4a.5 .5 0 0 1 .5 -.5" }], ["path", { "d": "M6 10v.01" }], ["path", { "d": "M6 19v.01" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BinaryOffIcon
});

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
var indent_increase_exports = {};
__export(indent_increase_exports, {
  IndentIncreaseIcon: () => IndentIncreaseIcon
});
module.exports = __toCommonJS(indent_increase_exports);
var import_create_icon = require("../../create-icon.cjs");
const IndentIncreaseIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("IndentIncreaseIcon", [["path", { "d": "M21 5H11" }], ["path", { "d": "M21 12H11" }], ["path", { "d": "M21 19H11" }], ["path", { "d": "m3 8 4 4-4 4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  IndentIncreaseIcon
});

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
var rows_2_exports = {};
__export(rows_2_exports, {
  Rows2Icon: () => Rows2Icon
});
module.exports = __toCommonJS(rows_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const Rows2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Rows2Icon", [["rect", { "width": "18", "height": "18", "x": "3", "y": "3", "rx": "2" }], ["path", { "d": "M3 12h18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Rows2Icon
});

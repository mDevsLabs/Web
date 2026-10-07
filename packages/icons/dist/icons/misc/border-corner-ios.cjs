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
var border_corner_ios_exports = {};
__export(border_corner_ios_exports, {
  BorderCornerIosIcon: () => BorderCornerIosIcon
});
module.exports = __toCommonJS(border_corner_ios_exports);
var import_create_icon = require("../../create-icon.cjs");
const BorderCornerIosIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BorderCornerIosIcon", [["path", { "d": "M4 20c0 -6.559 0 -9.838 1.628 -12.162a9 9 0 0 1 2.21 -2.21c2.324 -1.628 5.602 -1.628 12.162 -1.628" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BorderCornerIosIcon
});

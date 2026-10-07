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
var gem_exports = {};
__export(gem_exports, {
  GemIcon: () => GemIcon
});
module.exports = __toCommonJS(gem_exports);
var import_create_icon = require("../../create-icon.cjs");
const GemIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("GemIcon", [["path", { "d": "M10.5 3 8 9l4 13 4-13-2.5-6" }], ["path", { "d": "M17 3a2 2 0 0 1 1.6.8l3 4a2 2 0 0 1 .013 2.382l-7.99 10.986a2 2 0 0 1-3.247 0l-7.99-10.986A2 2 0 0 1 2.4 7.8l2.998-3.997A2 2 0 0 1 7 3z" }], ["path", { "d": "M2 9h20" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GemIcon
});

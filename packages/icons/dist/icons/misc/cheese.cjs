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
var cheese_exports = {};
__export(cheese_exports, {
  CheeseIcon: () => CheeseIcon
});
module.exports = __toCommonJS(cheese_exports);
var import_create_icon = require("../../create-icon.cjs");
const CheeseIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CheeseIcon", [["path", { "d": "M4.519 20.008l16.481 -.008v-3.5a2 2 0 1 1 0 -4v-3.5h-16.722" }], ["path", { "d": "M21 9l-9.385 -4.992c-2.512 .12 -4.758 1.42 -6.327 3.425c-1.423 1.82 -2.288 4.221 -2.288 6.854c0 2.117 .56 4.085 1.519 5.721" }], ["path", { "d": "M15 13v.01" }], ["path", { "d": "M8 13v.01" }], ["path", { "d": "M11 16v.01" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CheeseIcon
});

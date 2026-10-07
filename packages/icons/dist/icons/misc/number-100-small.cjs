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
var number_100_small_exports = {};
__export(number_100_small_exports, {
  Number100SmallIcon: () => Number100SmallIcon
});
module.exports = __toCommonJS(number_100_small_exports);
var import_create_icon = require("../../create-icon.cjs");
const Number100SmallIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Number100SmallIcon", [["path", { "d": "M4 8h1v8" }], ["path", { "d": "M9 10v4a2 2 0 1 0 4 0v-4a2 2 0 1 0 -4 0" }], ["path", { "d": "M16 10v4a2 2 0 1 0 4 0v-4a2 2 0 1 0 -4 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Number100SmallIcon
});

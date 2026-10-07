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
var bmp_exports = {};
__export(bmp_exports, {
  BmpIcon: () => BmpIcon
});
module.exports = __toCommonJS(bmp_exports);
var import_create_icon = require("../../create-icon.cjs");
const BmpIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BmpIcon", [["path", { "d": "M18 16v-8h2a2 2 0 1 1 0 4h-2" }], ["path", { "d": "M6 14a2 2 0 0 1 -2 2h-2v-8h2a2 2 0 1 1 0 4h-2h2a2 2 0 0 1 2 2" }], ["path", { "d": "M9 16v-8l3 6l3 -6v8" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BmpIcon
});

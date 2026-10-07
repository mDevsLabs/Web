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
var backpack_off_exports = {};
__export(backpack_off_exports, {
  BackpackOffIcon: () => BackpackOffIcon
});
module.exports = __toCommonJS(backpack_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const BackpackOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BackpackOffIcon", [["path", { "d": "M10 6h3a6 6 0 0 1 6 6v3m-.129 3.872a3 3 0 0 1 -2.871 2.128h-8a3 3 0 0 1 -3 -3v-6a5.99 5.99 0 0 1 2.285 -4.712" }], ["path", { "d": "M10 6v-1a2 2 0 1 1 4 0v1" }], ["path", { "d": "M9 21v-4a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v4" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BackpackOffIcon
});

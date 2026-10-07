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
var shuffle_exports = {};
__export(shuffle_exports, {
  ShuffleIcon: () => ShuffleIcon
});
module.exports = __toCommonJS(shuffle_exports);
var import_create_icon = require("../../create-icon.cjs");
const ShuffleIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ShuffleIcon", [["path", { "d": "m18 14 4 4-4 4" }], ["path", { "d": "m18 2 4 4-4 4" }], ["path", { "d": "M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22" }], ["path", { "d": "M2 6h1.972a4 4 0 0 1 3.6 2.2" }], ["path", { "d": "M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ShuffleIcon
});

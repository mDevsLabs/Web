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
var bubbles_exports = {};
__export(bubbles_exports, {
  BubblesIcon: () => BubblesIcon
});
module.exports = __toCommonJS(bubbles_exports);
var import_create_icon = require("../../create-icon.cjs");
const BubblesIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BubblesIcon", [["path", { "d": "M7.001 15.085A1.5 1.5 0 0 1 9 16.5" }], ["circle", { "cx": "18.5", "cy": "8.5", "r": "3.5" }], ["circle", { "cx": "7.5", "cy": "16.5", "r": "5.5" }], ["circle", { "cx": "7.5", "cy": "4.5", "r": "2.5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BubblesIcon
});

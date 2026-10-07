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
var sigma_square_exports = {};
__export(sigma_square_exports, {
  SigmaSquareIcon: () => SigmaSquareIcon
});
module.exports = __toCommonJS(sigma_square_exports);
var import_create_icon = require("../../create-icon.cjs");
const SigmaSquareIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SigmaSquareIcon", [["rect", { "width": "18", "height": "18", "x": "3", "y": "3", "rx": "2" }], ["path", { "d": "M16 8.9V7H8l4 5-4 5h8v-1.9" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SigmaSquareIcon
});

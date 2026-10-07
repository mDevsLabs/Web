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
var decimals_arrow_right_exports = {};
__export(decimals_arrow_right_exports, {
  DecimalsArrowRightIcon: () => DecimalsArrowRightIcon
});
module.exports = __toCommonJS(decimals_arrow_right_exports);
var import_create_icon = require("../../create-icon.cjs");
const DecimalsArrowRightIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("DecimalsArrowRightIcon", [["path", { "d": "M10 18h10" }], ["path", { "d": "m17 21 3-3-3-3" }], ["path", { "d": "M3 11h.01" }], ["rect", { "x": "15", "y": "3", "width": "5", "height": "8", "rx": "2.5" }], ["rect", { "x": "6", "y": "3", "width": "5", "height": "8", "rx": "2.5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DecimalsArrowRightIcon
});

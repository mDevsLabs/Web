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
var percent_exports = {};
__export(percent_exports, {
  PercentIcon: () => PercentIcon
});
module.exports = __toCommonJS(percent_exports);
var import_create_icon = require("../../create-icon.cjs");
const PercentIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("PercentIcon", [["line", { "x1": "19", "x2": "5", "y1": "5", "y2": "19" }], ["circle", { "cx": "6.5", "cy": "6.5", "r": "2.5" }], ["circle", { "cx": "17.5", "cy": "17.5", "r": "2.5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PercentIcon
});

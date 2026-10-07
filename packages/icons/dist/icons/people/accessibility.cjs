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
var accessibility_exports = {};
__export(accessibility_exports, {
  AccessibilityIcon: () => AccessibilityIcon
});
module.exports = __toCommonJS(accessibility_exports);
var import_create_icon = require("../../create-icon.cjs");
const AccessibilityIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AccessibilityIcon", [["circle", { "cx": "16", "cy": "4", "r": "1" }], ["path", { "d": "m18 19 1-7-6 1" }], ["path", { "d": "m5 8 3-3 5.5 3-2.36 3.5" }], ["path", { "d": "M4.24 14.5a5 5 0 0 0 6.88 6" }], ["path", { "d": "M13.76 17.5a5 5 0 0 0-6.88-6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AccessibilityIcon
});

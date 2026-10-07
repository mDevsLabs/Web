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
var badge_info_exports = {};
__export(badge_info_exports, {
  BadgeInfoIcon: () => BadgeInfoIcon
});
module.exports = __toCommonJS(badge_info_exports);
var import_create_icon = require("../../create-icon.cjs");
const BadgeInfoIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BadgeInfoIcon", [["path", { "d": "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" }], ["line", { "x1": "12", "x2": "12", "y1": "16", "y2": "12" }], ["line", { "x1": "12", "x2": "12.01", "y1": "8", "y2": "8" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BadgeInfoIcon
});

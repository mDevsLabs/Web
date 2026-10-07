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
var badge_percent_exports = {};
__export(badge_percent_exports, {
  BadgePercentIcon: () => BadgePercentIcon
});
module.exports = __toCommonJS(badge_percent_exports);
var import_create_icon = require("../../create-icon.cjs");
const BadgePercentIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BadgePercentIcon", [["path", { "d": "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" }], ["path", { "d": "m15 9-6 6" }], ["path", { "d": "M9 9h.01" }], ["path", { "d": "M15 15h.01" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BadgePercentIcon
});

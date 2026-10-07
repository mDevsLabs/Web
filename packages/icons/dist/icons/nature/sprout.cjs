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
var sprout_exports = {};
__export(sprout_exports, {
  SproutIcon: () => SproutIcon
});
module.exports = __toCommonJS(sprout_exports);
var import_create_icon = require("../../create-icon.cjs");
const SproutIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SproutIcon", [["path", { "d": "M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3" }], ["path", { "d": "M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4" }], ["path", { "d": "M5 21h14" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SproutIcon
});

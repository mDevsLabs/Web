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
var blend_mode_exports = {};
__export(blend_mode_exports, {
  BlendModeIcon: () => BlendModeIcon
});
module.exports = __toCommonJS(blend_mode_exports);
var import_create_icon = require("../../create-icon.cjs");
const BlendModeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BlendModeIcon", [["path", { "d": "M8 9.5a6.5 6.5 0 1 0 13 0a6.5 6.5 0 1 0 -13 0" }], ["path", { "d": "M3 14.5a6.5 6.5 0 1 0 13 0a6.5 6.5 0 1 0 -13 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BlendModeIcon
});

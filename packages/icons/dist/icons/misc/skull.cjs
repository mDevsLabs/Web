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
var skull_exports = {};
__export(skull_exports, {
  SkullIcon: () => SkullIcon
});
module.exports = __toCommonJS(skull_exports);
var import_create_icon = require("../../create-icon.cjs");
const SkullIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SkullIcon", [["path", { "d": "m12.5 17-.5-1-.5 1h1z" }], ["path", { "d": "M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z" }], ["circle", { "cx": "15", "cy": "12", "r": "1" }], ["circle", { "cx": "9", "cy": "12", "r": "1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SkullIcon
});

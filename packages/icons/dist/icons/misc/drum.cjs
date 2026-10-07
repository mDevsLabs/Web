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
var drum_exports = {};
__export(drum_exports, {
  DrumIcon: () => DrumIcon
});
module.exports = __toCommonJS(drum_exports);
var import_create_icon = require("../../create-icon.cjs");
const DrumIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("DrumIcon", [["path", { "d": "m2 2 8 8" }], ["path", { "d": "m22 2-8 8" }], ["ellipse", { "cx": "12", "cy": "9", "rx": "10", "ry": "5" }], ["path", { "d": "M7 13.4v7.9" }], ["path", { "d": "M12 14v8" }], ["path", { "d": "M17 13.4v7.9" }], ["path", { "d": "M2 9v8a10 5 0 0 0 20 0V9" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DrumIcon
});

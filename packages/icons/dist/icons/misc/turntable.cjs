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
var turntable_exports = {};
__export(turntable_exports, {
  TurntableIcon: () => TurntableIcon
});
module.exports = __toCommonJS(turntable_exports);
var import_create_icon = require("../../create-icon.cjs");
const TurntableIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("TurntableIcon", [["path", { "d": "M10 12.01h.01" }], ["path", { "d": "M18 8v4a8 8 0 0 1-1.07 4" }], ["circle", { "cx": "10", "cy": "12", "r": "4" }], ["rect", { "x": "2", "y": "4", "width": "20", "height": "16", "rx": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TurntableIcon
});

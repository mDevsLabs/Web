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
var palette_exports = {};
__export(palette_exports, {
  PaletteIcon: () => PaletteIcon
});
module.exports = __toCommonJS(palette_exports);
var import_create_icon = require("../../create-icon.cjs");
const PaletteIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("PaletteIcon", [["path", { "d": "M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z" }], ["circle", { "cx": "13.5", "cy": "6.5", "r": ".5", "fill": "currentColor" }], ["circle", { "cx": "17.5", "cy": "10.5", "r": ".5", "fill": "currentColor" }], ["circle", { "cx": "6.5", "cy": "12.5", "r": ".5", "fill": "currentColor" }], ["circle", { "cx": "8.5", "cy": "7.5", "r": ".5", "fill": "currentColor" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PaletteIcon
});

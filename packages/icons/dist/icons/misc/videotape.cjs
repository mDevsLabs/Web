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
var videotape_exports = {};
__export(videotape_exports, {
  VideotapeIcon: () => VideotapeIcon
});
module.exports = __toCommonJS(videotape_exports);
var import_create_icon = require("../../create-icon.cjs");
const VideotapeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("VideotapeIcon", [["rect", { "width": "20", "height": "16", "x": "2", "y": "4", "rx": "2" }], ["path", { "d": "M2 8h20" }], ["circle", { "cx": "8", "cy": "14", "r": "2" }], ["path", { "d": "M8 12h8" }], ["circle", { "cx": "16", "cy": "14", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  VideotapeIcon
});

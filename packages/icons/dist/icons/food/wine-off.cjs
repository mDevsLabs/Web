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
var wine_off_exports = {};
__export(wine_off_exports, {
  WineOffIcon: () => WineOffIcon
});
module.exports = __toCommonJS(wine_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const WineOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("WineOffIcon", [["path", { "d": "M8 22h8" }], ["path", { "d": "M7 10h3m7 0h-1.343" }], ["path", { "d": "M12 15v7" }], ["path", { "d": "M7.307 7.307A12.33 12.33 0 0 0 7 10a5 5 0 0 0 7.391 4.391M8.638 2.981C8.75 2.668 8.872 2.34 9 2h6c1.5 4 2 6 2 8 0 .407-.05.809-.145 1.198" }], ["line", { "x1": "2", "x2": "22", "y1": "2", "y2": "22" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  WineOffIcon
});

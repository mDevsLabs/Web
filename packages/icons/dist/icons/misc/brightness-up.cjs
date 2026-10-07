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
var brightness_up_exports = {};
__export(brightness_up_exports, {
  BrightnessUpIcon: () => BrightnessUpIcon
});
module.exports = __toCommonJS(brightness_up_exports);
var import_create_icon = require("../../create-icon.cjs");
const BrightnessUpIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BrightnessUpIcon", [["path", { "d": "M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" }], ["path", { "d": "M12 5l0 -2" }], ["path", { "d": "M17 7l1.4 -1.4" }], ["path", { "d": "M19 12l2 0" }], ["path", { "d": "M17 17l1.4 1.4" }], ["path", { "d": "M12 19l0 2" }], ["path", { "d": "M7 17l-1.4 1.4" }], ["path", { "d": "M6 12l-2 0" }], ["path", { "d": "M7 7l-1.4 -1.4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BrightnessUpIcon
});

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
var vibrate_off_exports = {};
__export(vibrate_off_exports, {
  VibrateOffIcon: () => VibrateOffIcon
});
module.exports = __toCommonJS(vibrate_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const VibrateOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("VibrateOffIcon", [["path", { "d": "m2 8 2 2-2 2 2 2-2 2" }], ["path", { "d": "m22 8-2 2 2 2-2 2 2 2" }], ["path", { "d": "M8 8v10c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2" }], ["path", { "d": "M16 10.34V6c0-.55-.45-1-1-1h-4.34" }], ["line", { "x1": "2", "x2": "22", "y1": "2", "y2": "22" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  VibrateOffIcon
});

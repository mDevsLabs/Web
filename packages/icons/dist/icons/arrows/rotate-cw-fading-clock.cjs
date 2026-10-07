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
var rotate_cw_fading_clock_exports = {};
__export(rotate_cw_fading_clock_exports, {
  RotateCwFadingClockIcon: () => RotateCwFadingClockIcon
});
module.exports = __toCommonJS(rotate_cw_fading_clock_exports);
var import_create_icon = require("../../create-icon.cjs");
const RotateCwFadingClockIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("RotateCwFadingClockIcon", [["path", { "d": "M12 3a9.75 9.75 0 0 1 6.74 2.74" }], ["path", { "d": "M18.74 5.74 21 8" }], ["path", { "d": "M21 8V3" }], ["path", { "d": "M7.5 19.794c-6-3.464-6-12.124 0-15.588" }], ["path", { "d": "M7.5 4.206A9 9 0 0 1 12 3" }], ["path", { "d": "M12 7v5l4 2" }], ["path", { "d": "M14 20.775A9 9 0 0 1 12 21" }], ["path", { "d": "M19 17.656a9 9 0 0 1-1.5 1.456" }], ["path", { "d": "M21 12a9 9 0 0 1-.228 2" }], ["path", { "d": "M21 8h-5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RotateCwFadingClockIcon
});

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
var globe_off_exports = {};
__export(globe_off_exports, {
  GlobeOffIcon: () => GlobeOffIcon
});
module.exports = __toCommonJS(globe_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const GlobeOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("GlobeOffIcon", [["path", { "d": "M10.114 4.462A14.5 14.5 0 0 1 12 2a10 10 0 0 1 9.313 13.643" }], ["path", { "d": "M15.557 15.556A14.5 14.5 0 0 1 12 22 10 10 0 0 1 4.929 4.929" }], ["path", { "d": "M15.892 10.234A14.5 14.5 0 0 0 12 2a10 10 0 0 0-3.643.687" }], ["path", { "d": "M17.656 12H22" }], ["path", { "d": "M19.071 19.071A10 10 0 0 1 12 22 14.5 14.5 0 0 1 8.44 8.45" }], ["path", { "d": "M2 12h10" }], ["path", { "d": "m2 2 20 20" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GlobeOffIcon
});

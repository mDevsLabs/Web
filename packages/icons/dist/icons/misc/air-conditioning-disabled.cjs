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
var air_conditioning_disabled_exports = {};
__export(air_conditioning_disabled_exports, {
  AirConditioningDisabledIcon: () => AirConditioningDisabledIcon
});
module.exports = __toCommonJS(air_conditioning_disabled_exports);
var import_create_icon = require("../../create-icon.cjs");
const AirConditioningDisabledIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AirConditioningDisabledIcon", [["path", { "d": "M3 10a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2l0 -4" }], ["path", { "d": "M7 16v-3a1 1 0 0 1 1 -1h8a1 1 0 0 1 1 1v3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AirConditioningDisabledIcon
});

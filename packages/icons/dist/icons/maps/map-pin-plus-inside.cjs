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
var map_pin_plus_inside_exports = {};
__export(map_pin_plus_inside_exports, {
  MapPinPlusInsideIcon: () => MapPinPlusInsideIcon
});
module.exports = __toCommonJS(map_pin_plus_inside_exports);
var import_create_icon = require("../../create-icon.cjs");
const MapPinPlusInsideIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MapPinPlusInsideIcon", [["path", { "d": "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" }], ["path", { "d": "M12 7v6" }], ["path", { "d": "M9 10h6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MapPinPlusInsideIcon
});

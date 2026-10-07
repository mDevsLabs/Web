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
var map_pin_x_exports = {};
__export(map_pin_x_exports, {
  MapPinXIcon: () => MapPinXIcon
});
module.exports = __toCommonJS(map_pin_x_exports);
var import_create_icon = require("../../create-icon.cjs");
const MapPinXIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MapPinXIcon", [["path", { "d": "M19.752 11.901A7.78 7.78 0 0 0 20 10a8 8 0 0 0-16 0c0 4.993 5.539 10.193 7.399 11.799a1 1 0 0 0 1.202 0 19 19 0 0 0 .09-.077" }], ["circle", { "cx": "12", "cy": "10", "r": "3" }], ["path", { "d": "m21.5 15.5-5 5" }], ["path", { "d": "m21.5 20.5-5-5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MapPinXIcon
});

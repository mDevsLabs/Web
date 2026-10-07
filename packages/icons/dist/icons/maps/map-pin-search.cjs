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
var map_pin_search_exports = {};
__export(map_pin_search_exports, {
  MapPinSearchIcon: () => MapPinSearchIcon
});
module.exports = __toCommonJS(map_pin_search_exports);
var import_create_icon = require("../../create-icon.cjs");
const MapPinSearchIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MapPinSearchIcon", [["path", { "d": "M 12.248 21.969 a 1 1 0 0 1 -0.849 -0.17 C 9.539 20.193 4 14.993 4 10 a 8 8 0 0 1 16 0 C 20 10.42 19.961 10.841 19.888 11.262" }], ["path", { "d": "m22 22-1.88-1.88" }], ["circle", { "cx": "12", "cy": "10", "r": "3" }], ["circle", { "cx": "18", "cy": "18", "r": "3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MapPinSearchIcon
});

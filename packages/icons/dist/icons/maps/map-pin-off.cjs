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
var map_pin_off_exports = {};
__export(map_pin_off_exports, {
  MapPinOffIcon: () => MapPinOffIcon
});
module.exports = __toCommonJS(map_pin_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const MapPinOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MapPinOffIcon", [["path", { "d": "M12.75 7.09a3 3 0 0 1 2.16 2.16" }], ["path", { "d": "M17.072 17.072c-1.634 2.17-3.527 3.912-4.471 4.727a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 1.432-4.568" }], ["path", { "d": "m2 2 20 20" }], ["path", { "d": "M8.475 2.818A8 8 0 0 1 20 10c0 1.183-.31 2.377-.81 3.533" }], ["path", { "d": "M9.13 9.13a3 3 0 0 0 3.74 3.74" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MapPinOffIcon
});

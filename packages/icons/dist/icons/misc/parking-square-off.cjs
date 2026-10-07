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
var parking_square_off_exports = {};
__export(parking_square_off_exports, {
  ParkingSquareOffIcon: () => ParkingSquareOffIcon
});
module.exports = __toCommonJS(parking_square_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const ParkingSquareOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ParkingSquareOffIcon", [["path", { "d": "M3.6 3.6A2 2 0 0 1 5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-.59 1.41" }], ["path", { "d": "M3 8.7V19a2 2 0 0 0 2 2h10.3" }], ["path", { "d": "m2 2 20 20" }], ["path", { "d": "M13 13a3 3 0 1 0 0-6H9v2" }], ["path", { "d": "M9 17v-2.3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ParkingSquareOffIcon
});

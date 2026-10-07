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
var bike_off_exports = {};
__export(bike_off_exports, {
  BikeOffIcon: () => BikeOffIcon
});
module.exports = __toCommonJS(bike_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const BikeOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BikeOffIcon", [["path", { "d": "M2 18a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" }], ["path", { "d": "M16.437 16.44a3 3 0 0 0 4.123 4.123m1.44 -2.563a3 3 0 0 0 -3 -3" }], ["path", { "d": "M12 19v-4l-3 -3l1.665 -1.332m2.215 -1.772l1.12 -.896l2 3h3" }], ["path", { "d": "M16 5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BikeOffIcon
});

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
var car_door_exports = {};
__export(car_door_exports, {
  CarDoorIcon: () => CarDoorIcon
});
module.exports = __toCommonJS(car_door_exports);
var import_create_icon = require("../../create-icon.cjs");
const CarDoorIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CarDoorIcon", [["path", { "d": "M13 14h2" }], ["path", { "d": "M19 10h-16" }], ["path", { "d": "M6.7 3.45l-3.7 5.55v3.08a1 1 0 0 0 .85 1a6 6 0 0 1 5.15 5.92v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1 -1v-16a1 1 0 0 0 -1 -1h-10.46a1 1 0 0 0 -.84 .45" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CarDoorIcon
});

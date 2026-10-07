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
var cable_car_exports = {};
__export(cable_car_exports, {
  CableCarIcon: () => CableCarIcon
});
module.exports = __toCommonJS(cable_car_exports);
var import_create_icon = require("../../create-icon.cjs");
const CableCarIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CableCarIcon", [["path", { "d": "M10 3h.01" }], ["path", { "d": "M14 2h.01" }], ["path", { "d": "m2 9 20-5" }], ["path", { "d": "M12 12V6.5" }], ["rect", { "width": "16", "height": "10", "x": "4", "y": "12", "rx": "3" }], ["path", { "d": "M9 12v5" }], ["path", { "d": "M15 12v5" }], ["path", { "d": "M4 17h16" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CableCarIcon
});

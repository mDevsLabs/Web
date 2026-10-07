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
var bus_front_exports = {};
__export(bus_front_exports, {
  BusFrontIcon: () => BusFrontIcon
});
module.exports = __toCommonJS(bus_front_exports);
var import_create_icon = require("../../create-icon.cjs");
const BusFrontIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BusFrontIcon", [["path", { "d": "M4 6 2 7" }], ["path", { "d": "M10 6h4" }], ["path", { "d": "m22 7-2-1" }], ["rect", { "width": "16", "height": "16", "x": "4", "y": "3", "rx": "2" }], ["path", { "d": "M4 11h16" }], ["path", { "d": "M8 15h.01" }], ["path", { "d": "M16 15h.01" }], ["path", { "d": "M6 19v2" }], ["path", { "d": "M18 21v-2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BusFrontIcon
});

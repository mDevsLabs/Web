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
var carton_off_exports = {};
__export(carton_off_exports, {
  CartonOffIcon: () => CartonOffIcon
});
module.exports = __toCommonJS(carton_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const CartonOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CartonOffIcon", [["path", { "d": "M10 10H5v10a2 2 0 002 2h10a2 2 0 002-2v-1" }], ["path", { "d": "M13 22v-9" }], ["path", { "d": "M13.902 8.245 16 6h-4.343" }], ["path", { "d": "M19 13.343V10a2 2 0 00-.539-1.367L16 6V3a1 1 0 00-1-1H9a1 1 0 00-.857.486" }], ["path", { "d": "m2 2 20 20" }], ["path", { "d": "M7.034 7.034 5.539 8.633A2 2 0 005 10" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CartonOffIcon
});

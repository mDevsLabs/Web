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
var thermometer_sun_exports = {};
__export(thermometer_sun_exports, {
  ThermometerSunIcon: () => ThermometerSunIcon
});
module.exports = __toCommonJS(thermometer_sun_exports);
var import_create_icon = require("../../create-icon.cjs");
const ThermometerSunIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ThermometerSunIcon", [["path", { "d": "M12 2v2" }], ["path", { "d": "M12 8a4 4 0 0 0-1.645 7.647" }], ["path", { "d": "M2 12h2" }], ["path", { "d": "M20 14.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0z" }], ["path", { "d": "m4.93 4.93 1.41 1.41" }], ["path", { "d": "m6.34 17.66-1.41 1.41" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ThermometerSunIcon
});

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
var air_vent_exports = {};
__export(air_vent_exports, {
  AirVentIcon: () => AirVentIcon
});
module.exports = __toCommonJS(air_vent_exports);
var import_create_icon = require("../../create-icon.cjs");
const AirVentIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AirVentIcon", [["path", { "d": "M18 17.5a2.5 2.5 0 1 1-4 2.03V12" }], ["path", { "d": "M6 12H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" }], ["path", { "d": "M6 8h12" }], ["path", { "d": "M6.6 15.572A2 2 0 1 0 10 17v-5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AirVentIcon
});

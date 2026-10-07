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
var air_traffic_control_exports = {};
__export(air_traffic_control_exports, {
  AirTrafficControlIcon: () => AirTrafficControlIcon
});
module.exports = __toCommonJS(air_traffic_control_exports);
var import_create_icon = require("../../create-icon.cjs");
const AirTrafficControlIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AirTrafficControlIcon", [["path", { "d": "M11 3h2" }], ["path", { "d": "M12 3v3" }], ["path", { "d": "M5.998 6h12.004a2 2 0 0 1 1.916 2.575l-1.8 6a2 2 0 0 1 -1.916 1.425h-8.404a2 2 0 0 1 -1.916 -1.425l-1.8 -6a2 2 0 0 1 1.916 -2.575" }], ["path", { "d": "M8.5 6l1.5 10v5" }], ["path", { "d": "M15.5 6l-1.5 10v5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AirTrafficControlIcon
});

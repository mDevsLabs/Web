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
var gauge_exports = {};
__export(gauge_exports, {
  GaugeIcon: () => GaugeIcon
});
module.exports = __toCommonJS(gauge_exports);
var import_create_icon = require("../../create-icon.cjs");
const GaugeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("GaugeIcon", [["path", { "d": "m12 14 4-4" }], ["path", { "d": "M3.34 19a10 10 0 1 1 17.32 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GaugeIcon
});

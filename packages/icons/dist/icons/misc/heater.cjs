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
var heater_exports = {};
__export(heater_exports, {
  HeaterIcon: () => HeaterIcon
});
module.exports = __toCommonJS(heater_exports);
var import_create_icon = require("../../create-icon.cjs");
const HeaterIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("HeaterIcon", [["path", { "d": "M11 8c2-3-2-3 0-6" }], ["path", { "d": "M15.5 8c2-3-2-3 0-6" }], ["path", { "d": "M6 10h.01" }], ["path", { "d": "M6 14h.01" }], ["path", { "d": "M10 16v-4" }], ["path", { "d": "M14 16v-4" }], ["path", { "d": "M18 16v-4" }], ["path", { "d": "M20 6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3" }], ["path", { "d": "M5 20v2" }], ["path", { "d": "M19 20v2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HeaterIcon
});

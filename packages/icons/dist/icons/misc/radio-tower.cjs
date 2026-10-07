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
var radio_tower_exports = {};
__export(radio_tower_exports, {
  RadioTowerIcon: () => RadioTowerIcon
});
module.exports = __toCommonJS(radio_tower_exports);
var import_create_icon = require("../../create-icon.cjs");
const RadioTowerIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("RadioTowerIcon", [["path", { "d": "M4.9 16.1C1 12.2 1 5.8 4.9 1.9" }], ["path", { "d": "M7.8 4.7a6.14 6.14 0 0 0-.8 7.5" }], ["circle", { "cx": "12", "cy": "9", "r": "2" }], ["path", { "d": "M16.2 4.8c2 2 2.26 5.11.8 7.47" }], ["path", { "d": "M19.1 1.9a9.96 9.96 0 0 1 0 14.1" }], ["path", { "d": "M9.5 18h5" }], ["path", { "d": "m8 22 4-11 4 11" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RadioTowerIcon
});

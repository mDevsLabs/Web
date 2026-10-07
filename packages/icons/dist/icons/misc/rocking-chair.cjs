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
var rocking_chair_exports = {};
__export(rocking_chair_exports, {
  RockingChairIcon: () => RockingChairIcon
});
module.exports = __toCommonJS(rocking_chair_exports);
var import_create_icon = require("../../create-icon.cjs");
const RockingChairIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("RockingChairIcon", [["path", { "d": "m15 13 3.708 7.416" }], ["path", { "d": "M3 19a15 15 0 0 0 18 0" }], ["path", { "d": "m3 2 3.21 9.633A2 2 0 0 0 8.109 13H18" }], ["path", { "d": "m9 13-3.708 7.416" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RockingChairIcon
});

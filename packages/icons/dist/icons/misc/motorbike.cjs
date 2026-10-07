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
var motorbike_exports = {};
__export(motorbike_exports, {
  MotorbikeIcon: () => MotorbikeIcon
});
module.exports = __toCommonJS(motorbike_exports);
var import_create_icon = require("../../create-icon.cjs");
const MotorbikeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MotorbikeIcon", [["path", { "d": "m18 14-1-3" }], ["path", { "d": "m3 9 6 2a2 2 0 0 1 2-2h2a2 2 0 0 1 1.99 1.81" }], ["path", { "d": "M8 17h3a1 1 0 0 0 1-1 6 6 0 0 1 6-6 1 1 0 0 0 1-1v-.75A5 5 0 0 0 17 5" }], ["circle", { "cx": "19", "cy": "17", "r": "3" }], ["circle", { "cx": "5", "cy": "17", "r": "3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MotorbikeIcon
});

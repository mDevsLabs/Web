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
var dice_6_exports = {};
__export(dice_6_exports, {
  Dice6Icon: () => Dice6Icon
});
module.exports = __toCommonJS(dice_6_exports);
var import_create_icon = require("../../create-icon.cjs");
const Dice6Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Dice6Icon", [["rect", { "width": "18", "height": "18", "x": "3", "y": "3", "rx": "2", "ry": "2" }], ["path", { "d": "M16 8h.01" }], ["path", { "d": "M16 12h.01" }], ["path", { "d": "M16 16h.01" }], ["path", { "d": "M8 8h.01" }], ["path", { "d": "M8 12h.01" }], ["path", { "d": "M8 16h.01" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Dice6Icon
});

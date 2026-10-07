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
var carrot_exports = {};
__export(carrot_exports, {
  CarrotIcon: () => CarrotIcon
});
module.exports = __toCommonJS(carrot_exports);
var import_create_icon = require("../../create-icon.cjs");
const CarrotIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CarrotIcon", [["path", { "d": "M15 16a1 1 0 0 0-7-7q-4 4-5.987 12.385a.5.5 0 0 0 .602.602Q11 20 15 16l-3-3" }], ["path", { "d": "M15 9q4 4 7 0-3-4-7 0 4-4 0-7-4 3 0 7" }], ["path", { "d": "m8 15-2.58-2.58" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CarrotIcon
});

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
var barrel_exports = {};
__export(barrel_exports, {
  BarrelIcon: () => BarrelIcon
});
module.exports = __toCommonJS(barrel_exports);
var import_create_icon = require("../../create-icon.cjs");
const BarrelIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BarrelIcon", [["path", { "d": "M10 3a41 41 0 000 18" }], ["path", { "d": "M14 3a41 41 0 010 18" }], ["path", { "d": "M16.997 21a2 2 0 001.68-.92 15.25 15.25 0 000-16.16 2 2 0 00-1.68-.92h-10a2 2 0 00-1.681.92 15.25 15.25 0 000 16.16 2 2 0 001.681.92z" }], ["path", { "d": "M3.54 16h16.914" }], ["path", { "d": "M3.54 8h16.914" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BarrelIcon
});

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
var telescope_exports = {};
__export(telescope_exports, {
  TelescopeIcon: () => TelescopeIcon
});
module.exports = __toCommonJS(telescope_exports);
var import_create_icon = require("../../create-icon.cjs");
const TelescopeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("TelescopeIcon", [["path", { "d": "m10.065 12.493-6.18 1.318a.934.934 0 0 1-1.108-.702l-.537-2.15a1.07 1.07 0 0 1 .691-1.265l13.504-4.44" }], ["path", { "d": "m13.56 11.747 4.332-.924" }], ["path", { "d": "m16 21-3.105-6.21" }], ["path", { "d": "M16.485 5.94a2 2 0 0 1 1.455-2.425l1.09-.272a1 1 0 0 1 1.212.727l1.515 6.06a1 1 0 0 1-.727 1.213l-1.09.272a2 2 0 0 1-2.425-1.455z" }], ["path", { "d": "m6.158 8.633 1.114 4.456" }], ["path", { "d": "m8 21 3.105-6.21" }], ["circle", { "cx": "12", "cy": "13", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TelescopeIcon
});

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
var mountain_snow_exports = {};
__export(mountain_snow_exports, {
  MountainSnowIcon: () => MountainSnowIcon
});
module.exports = __toCommonJS(mountain_snow_exports);
var import_create_icon = require("../../create-icon.cjs");
const MountainSnowIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MountainSnowIcon", [["path", { "d": "m8 3 4 8 5-5 5 15H2L8 3z" }], ["path", { "d": "M4.14 15.08c2.62-1.57 5.24-1.43 7.86.42 2.74 1.94 5.49 2 8.23.19" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MountainSnowIcon
});

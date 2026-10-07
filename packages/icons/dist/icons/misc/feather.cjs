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
var feather_exports = {};
__export(feather_exports, {
  FeatherIcon: () => FeatherIcon
});
module.exports = __toCommonJS(feather_exports);
var import_create_icon = require("../../create-icon.cjs");
const FeatherIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("FeatherIcon", [["path", { "d": "M14.086 18.412A2 2 0 0112.67 19H5v-7.672a2 2 0 01.586-1.414L11.75 3.75a6 6 0 118.49 8.49z" }], ["path", { "d": "M16 8 2 22" }], ["path", { "d": "M17.488 15H9" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FeatherIcon
});

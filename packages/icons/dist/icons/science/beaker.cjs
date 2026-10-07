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
var beaker_exports = {};
__export(beaker_exports, {
  BeakerIcon: () => BeakerIcon
});
module.exports = __toCommonJS(beaker_exports);
var import_create_icon = require("../../create-icon.cjs");
const BeakerIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BeakerIcon", [["path", { "d": "M4.5 3h15" }], ["path", { "d": "M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3" }], ["path", { "d": "M6 14h12" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BeakerIcon
});

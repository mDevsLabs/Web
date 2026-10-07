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
var construction_exports = {};
__export(construction_exports, {
  ConstructionIcon: () => ConstructionIcon
});
module.exports = __toCommonJS(construction_exports);
var import_create_icon = require("../../create-icon.cjs");
const ConstructionIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ConstructionIcon", [["rect", { "x": "2", "y": "6", "width": "20", "height": "8", "rx": "1" }], ["path", { "d": "M17 14v7" }], ["path", { "d": "M7 14v7" }], ["path", { "d": "M17 3v3" }], ["path", { "d": "M7 3v3" }], ["path", { "d": "M10 14 2.3 6.3" }], ["path", { "d": "m14 6 7.7 7.7" }], ["path", { "d": "m8 6 8 8" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ConstructionIcon
});

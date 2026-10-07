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
var tractor_exports = {};
__export(tractor_exports, {
  TractorIcon: () => TractorIcon
});
module.exports = __toCommonJS(tractor_exports);
var import_create_icon = require("../../create-icon.cjs");
const TractorIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("TractorIcon", [["path", { "d": "m10 11 11 .9a1 1 0 0 1 .8 1.1l-.665 4.158a1 1 0 0 1-.988.842H20" }], ["path", { "d": "M16 18h-5" }], ["path", { "d": "M18 5a1 1 0 0 0-1 1v5.573" }], ["path", { "d": "M3 4h8.129a1 1 0 0 1 .99.863L13 11.246" }], ["path", { "d": "M4 11V4" }], ["path", { "d": "M7 15h.01" }], ["path", { "d": "M8 10.1V4" }], ["circle", { "cx": "18", "cy": "18", "r": "2" }], ["circle", { "cx": "7", "cy": "15", "r": "5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TractorIcon
});

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
var glasses_exports = {};
__export(glasses_exports, {
  GlassesIcon: () => GlassesIcon
});
module.exports = __toCommonJS(glasses_exports);
var import_create_icon = require("../../create-icon.cjs");
const GlassesIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("GlassesIcon", [["circle", { "cx": "6", "cy": "15", "r": "4" }], ["circle", { "cx": "18", "cy": "15", "r": "4" }], ["path", { "d": "M14 15a2 2 0 0 0-2-2 2 2 0 0 0-2 2" }], ["path", { "d": "M2.5 13 5 7c.7-1.3 1.4-2 3-2" }], ["path", { "d": "M21.5 13 19 7c-.7-1.3-1.5-2-3-2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GlassesIcon
});

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
var globe_x_exports = {};
__export(globe_x_exports, {
  GlobeXIcon: () => GlobeXIcon
});
module.exports = __toCommonJS(globe_x_exports);
var import_create_icon = require("../../create-icon.cjs");
const GlobeXIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("GlobeXIcon", [["path", { "d": "m16 3 5 5" }], ["path", { "d": "M2 12h20A10 10 0 1 1 12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 4-10" }], ["path", { "d": "m21 3-5 5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GlobeXIcon
});

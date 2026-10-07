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
var cricket_exports = {};
__export(cricket_exports, {
  CricketIcon: () => CricketIcon
});
module.exports = __toCommonJS(cricket_exports);
var import_create_icon = require("../../create-icon.cjs");
const CricketIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CricketIcon", [["path", { "d": "M11.105 18.79l-1 .992a4.159 4.159 0 0 1 -6.038 -5.715l.157 -.166l8.282 -8.401l1.5 1.5l3.45 -3.391a2.08 2.08 0 0 1 3.057 2.815l-.116 .126l-3.391 3.45l1.5 1.5l-3.668 3.617" }], ["path", { "d": "M10.5 7.5l6 6" }], ["path", { "d": "M11 18a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CricketIcon
});

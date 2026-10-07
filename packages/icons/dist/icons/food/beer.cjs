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
var beer_exports = {};
__export(beer_exports, {
  BeerIcon: () => BeerIcon
});
module.exports = __toCommonJS(beer_exports);
var import_create_icon = require("../../create-icon.cjs");
const BeerIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BeerIcon", [["path", { "d": "M17 11h1a3 3 0 0 1 0 6h-1" }], ["path", { "d": "M9 12v6" }], ["path", { "d": "M13 12v6" }], ["path", { "d": "M14 7.5c-1 0-1.44.5-3 .5s-2-.5-3-.5-1.72.5-2.5.5a2.5 2.5 0 0 1 0-5c.78 0 1.57.5 2.5.5S9.44 2 11 2s2 1.5 3 1.5 1.72-.5 2.5-.5a2.5 2.5 0 0 1 0 5c-.78 0-1.5-.5-2.5-.5Z" }], ["path", { "d": "M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BeerIcon
});

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
var beer_off_exports = {};
__export(beer_off_exports, {
  BeerOffIcon: () => BeerOffIcon
});
module.exports = __toCommonJS(beer_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const BeerOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BeerOffIcon", [["path", { "d": "M13 13v5" }], ["path", { "d": "M17 11.47V8" }], ["path", { "d": "M17 11h1a3 3 0 0 1 2.745 4.211" }], ["path", { "d": "m2 2 20 20" }], ["path", { "d": "M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3" }], ["path", { "d": "M7.536 7.535C6.766 7.649 6.154 8 5.5 8a2.5 2.5 0 0 1-1.768-4.268" }], ["path", { "d": "M8.727 3.204C9.306 2.767 9.885 2 11 2c1.56 0 2 1.5 3 1.5s1.72-.5 2.5-.5a1 1 0 1 1 0 5c-.78 0-1.5-.5-2.5-.5a3.149 3.149 0 0 0-.842.12" }], ["path", { "d": "M9 14.6V18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BeerOffIcon
});

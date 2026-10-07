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
var birdhouse_exports = {};
__export(birdhouse_exports, {
  BirdhouseIcon: () => BirdhouseIcon
});
module.exports = __toCommonJS(birdhouse_exports);
var import_create_icon = require("../../create-icon.cjs");
const BirdhouseIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BirdhouseIcon", [["path", { "d": "M12 18v4" }], ["path", { "d": "m17 18 1.956-11.468" }], ["path", { "d": "m3 8 7.82-5.615a2 2 0 0 1 2.36 0L21 8" }], ["path", { "d": "M4 18h16" }], ["path", { "d": "M7 18 5.044 6.532" }], ["circle", { "cx": "12", "cy": "10", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BirdhouseIcon
});

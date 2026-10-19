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
var bird_exports = {};
__export(bird_exports, {
  BirdIcon: () => BirdIcon
});
module.exports = __toCommonJS(bird_exports);
var import_create_icon = require("../../create-icon.js");
const BirdIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BirdIcon", [["path", { "d": "M16 7h.01" }], ["path", { "d": "M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20" }], ["path", { "d": "m20 7 2 .5-2 .5" }], ["path", { "d": "M10 18v3" }], ["path", { "d": "M14 17.75V21" }], ["path", { "d": "M7 18a6 6 0 0 0 3.84-10.61" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BirdIcon
});

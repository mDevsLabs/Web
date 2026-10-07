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
var theater_exports = {};
__export(theater_exports, {
  TheaterIcon: () => TheaterIcon
});
module.exports = __toCommonJS(theater_exports);
var import_create_icon = require("../../create-icon.cjs");
const TheaterIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("TheaterIcon", [["path", { "d": "M2 10s3-3 3-8" }], ["path", { "d": "M22 10s-3-3-3-8" }], ["path", { "d": "M10 2c0 4.4-3.6 8-8 8" }], ["path", { "d": "M14 2c0 4.4 3.6 8 8 8" }], ["path", { "d": "M2 10s2 2 2 5" }], ["path", { "d": "M22 10s-2 2-2 5" }], ["path", { "d": "M8 15h8" }], ["path", { "d": "M2 22v-1a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" }], ["path", { "d": "M14 22v-1a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TheaterIcon
});

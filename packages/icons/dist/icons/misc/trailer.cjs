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
var trailer_exports = {};
__export(trailer_exports, {
  TrailerIcon: () => TrailerIcon
});
module.exports = __toCommonJS(trailer_exports);
var import_create_icon = require("../../create-icon.cjs");
const TrailerIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("TrailerIcon", [["path", { "d": "M10 11.341V10" }], ["path", { "d": "M14 13v-3" }], ["path", { "d": "M18 17V8a2 2 0 00-2-2H4a2 2 0 00-2 2v7a2 2 0 002 2h2" }], ["path", { "d": "M22 15v1a1 1 0 01-1 1H10" }], ["path", { "d": "M6 11.341V10" }], ["circle", { "cx": "8", "cy": "17", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TrailerIcon
});

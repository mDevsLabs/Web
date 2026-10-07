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
var locate_exports = {};
__export(locate_exports, {
  LocateIcon: () => LocateIcon
});
module.exports = __toCommonJS(locate_exports);
var import_create_icon = require("../../create-icon.cjs");
const LocateIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("LocateIcon", [["line", { "x1": "2", "x2": "5", "y1": "12", "y2": "12" }], ["line", { "x1": "19", "x2": "22", "y1": "12", "y2": "12" }], ["line", { "x1": "12", "x2": "12", "y1": "2", "y2": "5" }], ["line", { "x1": "12", "x2": "12", "y1": "19", "y2": "22" }], ["circle", { "cx": "12", "cy": "12", "r": "7" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LocateIcon
});

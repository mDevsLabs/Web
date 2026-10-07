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
var hd_exports = {};
__export(hd_exports, {
  HdIcon: () => HdIcon
});
module.exports = __toCommonJS(hd_exports);
var import_create_icon = require("../../create-icon.cjs");
const HdIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("HdIcon", [["path", { "d": "M10 12H6" }], ["path", { "d": "M10 15V9" }], ["path", { "d": "M14 14.5a.5.5 0 0 0 .5.5h1a2.5 2.5 0 0 0 2.5-2.5v-1A2.5 2.5 0 0 0 15.5 9h-1a.5.5 0 0 0-.5.5z" }], ["path", { "d": "M6 15V9" }], ["rect", { "x": "2", "y": "5", "width": "20", "height": "14", "rx": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HdIcon
});

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
var copy_plus_exports = {};
__export(copy_plus_exports, {
  CopyPlusIcon: () => CopyPlusIcon
});
module.exports = __toCommonJS(copy_plus_exports);
var import_create_icon = require("../../create-icon.cjs");
const CopyPlusIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CopyPlusIcon", [["line", { "x1": "15", "x2": "15", "y1": "12", "y2": "18" }], ["line", { "x1": "12", "x2": "18", "y1": "15", "y2": "15" }], ["rect", { "width": "14", "height": "14", "x": "8", "y": "8", "rx": "2", "ry": "2" }], ["path", { "d": "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CopyPlusIcon
});

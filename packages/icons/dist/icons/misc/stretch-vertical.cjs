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
var stretch_vertical_exports = {};
__export(stretch_vertical_exports, {
  StretchVerticalIcon: () => StretchVerticalIcon
});
module.exports = __toCommonJS(stretch_vertical_exports);
var import_create_icon = require("../../create-icon.cjs");
const StretchVerticalIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("StretchVerticalIcon", [["rect", { "width": "6", "height": "20", "x": "4", "y": "2", "rx": "2" }], ["rect", { "width": "6", "height": "20", "x": "14", "y": "2", "rx": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  StretchVerticalIcon
});

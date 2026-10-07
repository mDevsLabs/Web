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
var loader_pinwheel_exports = {};
__export(loader_pinwheel_exports, {
  LoaderPinwheelIcon: () => LoaderPinwheelIcon
});
module.exports = __toCommonJS(loader_pinwheel_exports);
var import_create_icon = require("../../create-icon.cjs");
const LoaderPinwheelIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("LoaderPinwheelIcon", [["path", { "d": "M22 12a1 1 0 0 1-10 0 1 1 0 0 0-10 0" }], ["path", { "d": "M7 20.7a1 1 0 1 1 5-8.7 1 1 0 1 0 5-8.6" }], ["path", { "d": "M7 3.3a1 1 0 1 1 5 8.6 1 1 0 1 0 5 8.6" }], ["circle", { "cx": "12", "cy": "12", "r": "10" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LoaderPinwheelIcon
});

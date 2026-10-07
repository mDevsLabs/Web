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
var app_window_exports = {};
__export(app_window_exports, {
  AppWindowIcon: () => AppWindowIcon
});
module.exports = __toCommonJS(app_window_exports);
var import_create_icon = require("../../create-icon.cjs");
const AppWindowIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AppWindowIcon", [["rect", { "x": "2", "y": "4", "width": "20", "height": "16", "rx": "2" }], ["path", { "d": "M10 4v4" }], ["path", { "d": "M2 8h20" }], ["path", { "d": "M6 4v4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AppWindowIcon
});

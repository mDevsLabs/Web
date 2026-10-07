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
var grab_exports = {};
__export(grab_exports, {
  GrabIcon: () => GrabIcon
});
module.exports = __toCommonJS(grab_exports);
var import_create_icon = require("../../create-icon.cjs");
const GrabIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("GrabIcon", [["path", { "d": "M18 11.5V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1.4" }], ["path", { "d": "M14 10V8a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" }], ["path", { "d": "M10 9.9V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v5" }], ["path", { "d": "M6 14a2 2 0 0 0-2-2a2 2 0 0 0-2 2" }], ["path", { "d": "M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8 2 2 0 1 1 4 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GrabIcon
});

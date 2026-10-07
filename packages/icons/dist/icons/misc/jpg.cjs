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
var jpg_exports = {};
__export(jpg_exports, {
  JpgIcon: () => JpgIcon
});
module.exports = __toCommonJS(jpg_exports);
var import_create_icon = require("../../create-icon.cjs");
const JpgIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("JpgIcon", [["path", { "d": "M21 8h-2a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h2v-4h-1" }], ["path", { "d": "M10 16v-8h2a2 2 0 1 1 0 4h-2" }], ["path", { "d": "M3 8h4v6a2 2 0 0 1 -2 2h-1.5a.5 .5 0 0 1 -.5 -.5v-.5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  JpgIcon
});

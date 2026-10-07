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
var http_options_exports = {};
__export(http_options_exports, {
  HttpOptionsIcon: () => HttpOptionsIcon
});
module.exports = __toCommonJS(http_options_exports);
var import_create_icon = require("../../create-icon.cjs");
const HttpOptionsIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("HttpOptionsIcon", [["path", { "d": "M5 8a2 2 0 0 1 2 2v4a2 2 0 1 1 -4 0v-4a2 2 0 0 1 2 -2" }], ["path", { "d": "M10 12h2a2 2 0 1 0 0 -4h-2v8" }], ["path", { "d": "M17 8h4" }], ["path", { "d": "M19 8v8" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HttpOptionsIcon
});

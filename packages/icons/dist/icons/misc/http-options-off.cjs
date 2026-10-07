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
var http_options_off_exports = {};
__export(http_options_off_exports, {
  HttpOptionsOffIcon: () => HttpOptionsOffIcon
});
module.exports = __toCommonJS(http_options_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const HttpOptionsOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("HttpOptionsOffIcon", [["path", { "d": "M5 8a2 2 0 0 1 2 2v4a2 2 0 1 1 -4 0v-4a2 2 0 0 1 2 -2" }], ["path", { "d": "M10 12h2m2 -2a2 2 0 0 0 -2 -2m-2 2v6" }], ["path", { "d": "M17 8h4" }], ["path", { "d": "M19 8v7" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HttpOptionsOffIcon
});

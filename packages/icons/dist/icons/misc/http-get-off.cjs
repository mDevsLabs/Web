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
var http_get_off_exports = {};
__export(http_get_off_exports, {
  HttpGetOffIcon: () => HttpGetOffIcon
});
module.exports = __toCommonJS(http_get_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const HttpGetOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("HttpGetOffIcon", [["path", { "d": "M7 8h-2a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h2v-4h-1" }], ["path", { "d": "M14 8h-2m-2 2v6h4" }], ["path", { "d": "M10 12h2" }], ["path", { "d": "M17 8h4" }], ["path", { "d": "M19 8v7" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HttpGetOffIcon
});

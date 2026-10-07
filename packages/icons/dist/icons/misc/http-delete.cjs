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
var http_delete_exports = {};
__export(http_delete_exports, {
  HttpDeleteIcon: () => HttpDeleteIcon
});
module.exports = __toCommonJS(http_delete_exports);
var import_create_icon = require("../../create-icon.cjs");
const HttpDeleteIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("HttpDeleteIcon", [["path", { "d": "M3 8v8h2a2 2 0 0 0 2 -2v-4a2 2 0 0 0 -2 -2l-2 0" }], ["path", { "d": "M14 8h-4v8h4" }], ["path", { "d": "M10 12h2.5" }], ["path", { "d": "M17 8v8h4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HttpDeleteIcon
});

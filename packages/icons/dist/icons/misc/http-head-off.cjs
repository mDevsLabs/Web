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
var http_head_off_exports = {};
__export(http_head_off_exports, {
  HttpHeadOffIcon: () => HttpHeadOffIcon
});
module.exports = __toCommonJS(http_head_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const HttpHeadOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("HttpHeadOffIcon", [["path", { "d": "M3 16v-8" }], ["path", { "d": "M7 8v8" }], ["path", { "d": "M3 12h4" }], ["path", { "d": "M14 8h-2m-2 2v6h4" }], ["path", { "d": "M10 12h2" }], ["path", { "d": "M17 13v-3a2 2 0 1 1 4 0v6" }], ["path", { "d": "M17 13h4" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HttpHeadOffIcon
});

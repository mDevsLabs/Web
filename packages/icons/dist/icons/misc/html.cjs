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
var html_exports = {};
__export(html_exports, {
  HtmlIcon: () => HtmlIcon
});
module.exports = __toCommonJS(html_exports);
var import_create_icon = require("../../create-icon.cjs");
const HtmlIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("HtmlIcon", [["path", { "d": "M13 16v-8l2 5l2 -5v8" }], ["path", { "d": "M1 16v-8" }], ["path", { "d": "M5 8v8" }], ["path", { "d": "M1 12h4" }], ["path", { "d": "M7 8h4" }], ["path", { "d": "M9 8v8" }], ["path", { "d": "M20 8v8h3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HtmlIcon
});

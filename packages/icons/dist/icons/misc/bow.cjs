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
var bow_exports = {};
__export(bow_exports, {
  BowIcon: () => BowIcon
});
module.exports = __toCommonJS(bow_exports);
var import_create_icon = require("../../create-icon.cjs");
const BowIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BowIcon", [["path", { "d": "M17 3h4v4" }], ["path", { "d": "M21 3l-15 15" }], ["path", { "d": "M3 18h3v3" }], ["path", { "d": "M16.5 20c1.576 -1.576 2.5 -4.095 2.5 -6.5c0 -4.81 -3.69 -8.5 -8.5 -8.5c-2.415 0 -4.922 .913 -6.5 2.5l12.5 12.5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BowIcon
});

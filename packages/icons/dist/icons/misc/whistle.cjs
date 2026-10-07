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
var whistle_exports = {};
__export(whistle_exports, {
  WhistleIcon: () => WhistleIcon
});
module.exports = __toCommonJS(whistle_exports);
var import_create_icon = require("../../create-icon.cjs");
const WhistleIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("WhistleIcon", [["path", { "d": "M10 6v4" }], ["path", { "d": "M21 6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-5.675A7 7 0 1 1 9 6z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  WhistleIcon
});

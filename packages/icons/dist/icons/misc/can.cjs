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
var can_exports = {};
__export(can_exports, {
  CanIcon: () => CanIcon
});
module.exports = __toCommonJS(can_exports);
var import_create_icon = require("../../create-icon.cjs");
const CanIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CanIcon", [["path", { "d": "M21 10.5a9 2.5 0 01-18 0v8a9 2.5 0 0018 0z" }], ["path", { "d": "M21 10.5A9 2.5 25.32 004.59 3.47 9 2.5 25.32 0021 10.5" }], ["path", { "d": "M3 10.5a9 2.5 0 016.527-2.405" }], ["path", { "d": "M9 16.858a31 31 0 006 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CanIcon
});

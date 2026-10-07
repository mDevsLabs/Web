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
var radio_off_exports = {};
__export(radio_off_exports, {
  RadioOffIcon: () => RadioOffIcon
});
module.exports = __toCommonJS(radio_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const RadioOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("RadioOffIcon", [["path", { "d": "M13.414 13.414a2 2 0 1 1-2.828-2.828" }], ["path", { "d": "M16.247 7.761a6 6 0 0 1 1.744 4.572" }], ["path", { "d": "M19.075 4.933a10 10 0 0 1 2.234 10.72" }], ["path", { "d": "m2 2 20 20" }], ["path", { "d": "M4.925 19.067a10 10 0 0 1 0-14.134" }], ["path", { "d": "M7.753 16.239a6 6 0 0 1 0-8.478" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RadioOffIcon
});

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
var radio_exports = {};
__export(radio_exports, {
  RadioIcon: () => RadioIcon
});
module.exports = __toCommonJS(radio_exports);
var import_create_icon = require("../../create-icon.cjs");
const RadioIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("RadioIcon", [["path", { "d": "M16.247 7.761a6 6 0 0 1 0 8.478" }], ["path", { "d": "M19.075 4.933a10 10 0 0 1 0 14.134" }], ["path", { "d": "M4.925 19.067a10 10 0 0 1 0-14.134" }], ["path", { "d": "M7.753 16.239a6 6 0 0 1 0-8.478" }], ["circle", { "cx": "12", "cy": "12", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RadioIcon
});

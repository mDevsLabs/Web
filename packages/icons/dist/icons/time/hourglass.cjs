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
var hourglass_exports = {};
__export(hourglass_exports, {
  HourglassIcon: () => HourglassIcon
});
module.exports = __toCommonJS(hourglass_exports);
var import_create_icon = require("../../create-icon.cjs");
const HourglassIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("HourglassIcon", [["path", { "d": "M5 22h14" }], ["path", { "d": "M5 2h14" }], ["path", { "d": "M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" }], ["path", { "d": "M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HourglassIcon
});

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
var barbell_off_exports = {};
__export(barbell_off_exports, {
  BarbellOffIcon: () => BarbellOffIcon
});
module.exports = __toCommonJS(barbell_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const BarbellOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BarbellOffIcon", [["path", { "d": "M2 12h1" }], ["path", { "d": "M6 8h-2a1 1 0 0 0 -1 1v6a1 1 0 0 0 1 1h2" }], ["path", { "d": "M6.298 6.288a1 1 0 0 0 -.298 .712v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-8" }], ["path", { "d": "M9 12h3" }], ["path", { "d": "M15 15v2a1 1 0 0 0 1 1h1c.275 0 .523 -.11 .704 -.29m.296 -3.71v-7a1 1 0 0 0 -1 -1h-1a1 1 0 0 0 -1 1v4" }], ["path", { "d": "M18 8h2a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1" }], ["path", { "d": "M22 12h-1" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BarbellOffIcon
});

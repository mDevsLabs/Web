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
var barbell_exports = {};
__export(barbell_exports, {
  BarbellIcon: () => BarbellIcon
});
module.exports = __toCommonJS(barbell_exports);
var import_create_icon = require("../../create-icon.cjs");
const BarbellIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BarbellIcon", [["path", { "d": "M2 12h1" }], ["path", { "d": "M6 8h-2a1 1 0 0 0 -1 1v6a1 1 0 0 0 1 1h2" }], ["path", { "d": "M6 7v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-10a1 1 0 0 0 -1 -1h-1a1 1 0 0 0 -1 1" }], ["path", { "d": "M9 12h6" }], ["path", { "d": "M15 7v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-10a1 1 0 0 0 -1 -1h-1a1 1 0 0 0 -1 1" }], ["path", { "d": "M18 8h2a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-2" }], ["path", { "d": "M22 12h-1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BarbellIcon
});

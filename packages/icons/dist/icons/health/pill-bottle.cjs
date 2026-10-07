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
var pill_bottle_exports = {};
__export(pill_bottle_exports, {
  PillBottleIcon: () => PillBottleIcon
});
module.exports = __toCommonJS(pill_bottle_exports);
var import_create_icon = require("../../create-icon.cjs");
const PillBottleIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("PillBottleIcon", [["path", { "d": "M18 11h-4a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h4" }], ["path", { "d": "M6 7v13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" }], ["rect", { "width": "16", "height": "5", "x": "4", "y": "2", "rx": "1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PillBottleIcon
});

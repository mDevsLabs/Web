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
var anvil_exports = {};
__export(anvil_exports, {
  AnvilIcon: () => AnvilIcon
});
module.exports = __toCommonJS(anvil_exports);
var import_create_icon = require("../../create-icon.cjs");
const AnvilIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AnvilIcon", [["path", { "d": "M7 10H6a4 4 0 0 1-4-4 1 1 0 0 1 1-1h4" }], ["path", { "d": "M7 5a1 1 0 0 1 1-1h13a1 1 0 0 1 1 1 7 7 0 0 1-7 7H8a1 1 0 0 1-1-1z" }], ["path", { "d": "M9 12v5" }], ["path", { "d": "M15 12v5" }], ["path", { "d": "M5 20a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3 1 1 0 0 1-1 1H6a1 1 0 0 1-1-1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AnvilIcon
});

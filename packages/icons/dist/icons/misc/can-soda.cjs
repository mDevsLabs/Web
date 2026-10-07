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
var can_soda_exports = {};
__export(can_soda_exports, {
  CanSodaIcon: () => CanSodaIcon
});
module.exports = __toCommonJS(can_soda_exports);
var import_create_icon = require("../../create-icon.cjs");
const CanSodaIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CanSodaIcon", [["path", { "d": "m17 22 1.664-2.496a2 2 0 00.336-1.11V5.606a2 2 0 00-.336-1.11L17 2" }], ["path", { "d": "M18 22H6" }], ["path", { "d": "M18 2H6" }], ["path", { "d": "M5 17h14" }], ["path", { "d": "M5 7h14" }], ["path", { "d": "m7 22-1.664-2.496A2 2 0 015 18.394V5.606a2 2 0 01.336-1.11L7 2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CanSodaIcon
});

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
var abacus_off_exports = {};
__export(abacus_off_exports, {
  AbacusOffIcon: () => AbacusOffIcon
});
module.exports = __toCommonJS(abacus_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const AbacusOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AbacusOffIcon", [["path", { "d": "M5 5v16" }], ["path", { "d": "M19 21v-2m0 -4v-12" }], ["path", { "d": "M5 7h2m4 0h8" }], ["path", { "d": "M5 15h10" }], ["path", { "d": "M8 13v4" }], ["path", { "d": "M11 13v4" }], ["path", { "d": "M16 16v1" }], ["path", { "d": "M14 5v4" }], ["path", { "d": "M11 5v2" }], ["path", { "d": "M8 8v1" }], ["path", { "d": "M3 21h18" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AbacusOffIcon
});

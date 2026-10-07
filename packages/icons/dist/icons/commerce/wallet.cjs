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
var wallet_exports = {};
__export(wallet_exports, {
  WalletIcon: () => WalletIcon
});
module.exports = __toCommonJS(wallet_exports);
var import_create_icon = require("../../create-icon.cjs");
const WalletIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("WalletIcon", [["path", { "d": "M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" }], ["path", { "d": "M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  WalletIcon
});

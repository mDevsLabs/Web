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
var faucet_exports = {};
__export(faucet_exports, {
  FaucetIcon: () => FaucetIcon
});
module.exports = __toCommonJS(faucet_exports);
var import_create_icon = require("../../create-icon.cjs");
const FaucetIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("FaucetIcon", [["path", { "d": "M10.083 5.428 5.57 4.083a2 2 0 10.001 3.834l4.512-1.345" }], ["path", { "d": "M12 8v3" }], ["path", { "d": "m13.917 5.428 4.511-1.345a2 2 0 110 3.834l-4.51-1.345" }], ["path", { "d": "M18 17v-4.006" }], ["path", { "d": "M22 11v8" }], ["path", { "d": "M22 12h-3a1 1 0 00-1 .994h-2.539a4 4 0 00-6.915-.012L7 13a5 5 0 00-5 5v1a1 1 0 001 1h2a1 1 0 001-1v-1a1 1 0 01.995-1l1.552.018a4 4 0 006.907 0L18 17a1 1 0 001 1h3" }], ["circle", { "cx": "12", "cy": "6", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FaucetIcon
});

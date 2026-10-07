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
var mood_bitcoin_exports = {};
__export(mood_bitcoin_exports, {
  MoodBitcoinIcon: () => MoodBitcoinIcon
});
module.exports = __toCommonJS(mood_bitcoin_exports);
var import_create_icon = require("../../create-icon.cjs");
const MoodBitcoinIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MoodBitcoinIcon", [["path", { "d": "M17 21v-6m2 0v-1.5m0 9v-1.5m-2 -3h3m-1 0h.5a1.5 1.5 0 0 1 0 3h-3.5m3 -3h.5a1.5 1.5 0 0 0 0 -3h-3.5" }], ["path", { "d": "M20.87 10.48a9 9 0 1 0 -7.876 10.465" }], ["path", { "d": "M9 10h.01" }], ["path", { "d": "M15 10h.01" }], ["path", { "d": "M9.5 15c.658 .64 1.56 1 2.5 1c.357 0 .709 -.052 1.043 -.151" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MoodBitcoinIcon
});

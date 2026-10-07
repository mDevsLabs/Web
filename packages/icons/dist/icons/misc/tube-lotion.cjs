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
var tube_lotion_exports = {};
__export(tube_lotion_exports, {
  TubeLotionIcon: () => TubeLotionIcon
});
module.exports = __toCommonJS(tube_lotion_exports);
var import_create_icon = require("../../create-icon.cjs");
const TubeLotionIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("TubeLotionIcon", [["path", { "d": "M15 18v3a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-3" }], ["path", { "d": "M17 2a2 2 0 0 1 1.6 3.2A8 8 0 0 0 17 10v6a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-6a8 8 0 0 0-1.6-4.8A2 2 0 0 1 7 2z" }], ["path", { "d": "M7 10a6.47 6.47 0 0 1 5 0 6.47 6.47 0 0 0 5 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TubeLotionIcon
});

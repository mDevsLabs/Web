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
var waves_arrow_down_exports = {};
__export(waves_arrow_down_exports, {
  WavesArrowDownIcon: () => WavesArrowDownIcon
});
module.exports = __toCommonJS(waves_arrow_down_exports);
var import_create_icon = require("../../create-icon.cjs");
const WavesArrowDownIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("WavesArrowDownIcon", [["path", { "d": "M12 10L12 2" }], ["path", { "d": "M16 6L12 10L8 6" }], ["path", { "d": "M2 15C2.6 15.5 3.2 16 4.5 16C7 16 7 14 9.5 14C12.1 14 11.9 16 14.5 16C17 16 17 14 19.5 14C20.8 14 21.4 14.5 22 15" }], ["path", { "d": "M2 21C2.6 21.5 3.2 22 4.5 22C7 22 7 20 9.5 20C12.1 20 11.9 22 14.5 22C17 22 17 20 19.5 20C20.8 20 21.4 20.5 22 21" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  WavesArrowDownIcon
});

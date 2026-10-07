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
var house_plus_exports = {};
__export(house_plus_exports, {
  HousePlusIcon: () => HousePlusIcon
});
module.exports = __toCommonJS(house_plus_exports);
var import_create_icon = require("../../create-icon.cjs");
const HousePlusIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("HousePlusIcon", [["path", { "d": "M12.35 21H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 .71-1.53l7-6a2 2 0 0 1 2.58 0l7 6A2 2 0 0 1 21 10v2.35" }], ["path", { "d": "M14.8 12.4A1 1 0 0 0 14 12h-4a1 1 0 0 0-1 1v8" }], ["path", { "d": "M15 18h6" }], ["path", { "d": "M18 15v6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HousePlusIcon
});

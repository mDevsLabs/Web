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
var chef_hat_off_exports = {};
__export(chef_hat_off_exports, {
  ChefHatOffIcon: () => ChefHatOffIcon
});
module.exports = __toCommonJS(chef_hat_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const ChefHatOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ChefHatOffIcon", [["path", { "d": "M8.72 4.712a4 4 0 0 1 7.19 1.439a4 4 0 0 1 2.09 7.723v.126m0 4v3h-12v-7.126a4 4 0 0 1 .081 -7.796" }], ["path", { "d": "M6.161 17.009l10.839 -.009" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ChefHatOffIcon
});

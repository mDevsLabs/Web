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
var option_exports = {};
__export(option_exports, {
  OptionIcon: () => OptionIcon
});
module.exports = __toCommonJS(option_exports);
var import_create_icon = require("../../create-icon.cjs");
const OptionIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("OptionIcon", [["path", { "d": "M14 3h7" }], ["path", { "d": "M3 3h5.28a1 1 0 0 1 .948.684l5.544 16.632a1 1 0 0 0 .949.684H21" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  OptionIcon
});

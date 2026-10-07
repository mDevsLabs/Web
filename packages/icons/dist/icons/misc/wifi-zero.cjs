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
var wifi_zero_exports = {};
__export(wifi_zero_exports, {
  WifiZeroIcon: () => WifiZeroIcon
});
module.exports = __toCommonJS(wifi_zero_exports);
var import_create_icon = require("../../create-icon.cjs");
const WifiZeroIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("WifiZeroIcon", [["path", { "d": "M12 20h.01" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  WifiZeroIcon
});

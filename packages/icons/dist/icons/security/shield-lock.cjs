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
var shield_lock_exports = {};
__export(shield_lock_exports, {
  ShieldLockIcon: () => ShieldLockIcon
});
module.exports = __toCommonJS(shield_lock_exports);
var import_create_icon = require("../../create-icon.cjs");
const ShieldLockIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ShieldLockIcon", [["path", { "d": "M20 9.807V6a1 1 0 00-1-1c-2 0-4.49-1.19-6.24-2.72a1.17 1.17 0 00-1.52 0C9.5 3.8 7 5 5 5a1 1 0 00-1 1v7c0 3.88 2.107 6.254 5 7.796" }], ["path", { "d": "M19 17v-2a2 2 0 00-4 0v2" }], ["rect", { "x": "13", "y": "17", "width": "8", "height": "5", "rx": "1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ShieldLockIcon
});

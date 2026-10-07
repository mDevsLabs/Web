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
var vault_exports = {};
__export(vault_exports, {
  VaultIcon: () => VaultIcon
});
module.exports = __toCommonJS(vault_exports);
var import_create_icon = require("../../create-icon.cjs");
const VaultIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("VaultIcon", [["rect", { "width": "18", "height": "18", "x": "3", "y": "3", "rx": "2" }], ["circle", { "cx": "7.5", "cy": "7.5", "r": ".5", "fill": "currentColor" }], ["path", { "d": "m7.9 7.9 2.7 2.7" }], ["circle", { "cx": "16.5", "cy": "7.5", "r": ".5", "fill": "currentColor" }], ["path", { "d": "m13.4 10.6 2.7-2.7" }], ["circle", { "cx": "7.5", "cy": "16.5", "r": ".5", "fill": "currentColor" }], ["path", { "d": "m7.9 16.1 2.7-2.7" }], ["circle", { "cx": "16.5", "cy": "16.5", "r": ".5", "fill": "currentColor" }], ["path", { "d": "m13.4 13.4 2.7 2.7" }], ["circle", { "cx": "12", "cy": "12", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  VaultIcon
});

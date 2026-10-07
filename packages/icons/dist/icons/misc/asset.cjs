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
var asset_exports = {};
__export(asset_exports, {
  AssetIcon: () => AssetIcon
});
module.exports = __toCommonJS(asset_exports);
var import_create_icon = require("../../create-icon.cjs");
const AssetIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AssetIcon", [["path", { "d": "M3 15a6 6 0 1 0 12 0a6 6 0 1 0 -12 0" }], ["path", { "d": "M7 15a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }], ["path", { "d": "M17 5a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }], ["path", { "d": "M14.218 17.975l6.619 -12.174" }], ["path", { "d": "M6.079 9.756l12.217 -6.631" }], ["path", { "d": "M7 15a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AssetIcon
});

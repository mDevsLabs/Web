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
var brain_exports = {};
__export(brain_exports, {
  BrainIcon: () => BrainIcon
});
module.exports = __toCommonJS(brain_exports);
var import_create_icon = require("../../create-icon.cjs");
const BrainIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BrainIcon", [["path", { "d": "M12 18V5" }], ["path", { "d": "M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4" }], ["path", { "d": "M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5" }], ["path", { "d": "M17.997 5.125a4 4 0 0 1 2.526 5.77" }], ["path", { "d": "M18 18a4 4 0 0 0 2-7.464" }], ["path", { "d": "M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517" }], ["path", { "d": "M6 18a4 4 0 0 1-2-7.464" }], ["path", { "d": "M6.003 5.125a4 4 0 0 0-2.526 5.77" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BrainIcon
});

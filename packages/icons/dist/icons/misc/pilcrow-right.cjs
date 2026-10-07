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
var pilcrow_right_exports = {};
__export(pilcrow_right_exports, {
  PilcrowRightIcon: () => PilcrowRightIcon
});
module.exports = __toCommonJS(pilcrow_right_exports);
var import_create_icon = require("../../create-icon.cjs");
const PilcrowRightIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("PilcrowRightIcon", [["path", { "d": "M10 3v11" }], ["path", { "d": "M10 9H7a1 1 0 0 1 0-6h8" }], ["path", { "d": "M14 3v11" }], ["path", { "d": "m18 14 4 4H2" }], ["path", { "d": "m22 18-4 4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PilcrowRightIcon
});

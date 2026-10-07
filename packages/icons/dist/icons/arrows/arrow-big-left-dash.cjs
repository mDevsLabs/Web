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
var arrow_big_left_dash_exports = {};
__export(arrow_big_left_dash_exports, {
  ArrowBigLeftDashIcon: () => ArrowBigLeftDashIcon
});
module.exports = __toCommonJS(arrow_big_left_dash_exports);
var import_create_icon = require("../../create-icon.cjs");
const ArrowBigLeftDashIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ArrowBigLeftDashIcon", [["path", { "d": "M13 9a1 1 0 0 1-1-1V4.707a.707.707 0 0 0-1.207-.5l-6.94 6.94a1.207 1.207 0 0 0 0 1.707l6.94 6.94a.707.707 0 0 0 1.207-.5V16a1 1 0 0 1 1-1h2a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1z" }], ["path", { "d": "M20 9v6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ArrowBigLeftDashIcon
});

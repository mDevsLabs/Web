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
var arrow_big_up_dash_exports = {};
__export(arrow_big_up_dash_exports, {
  ArrowBigUpDashIcon: () => ArrowBigUpDashIcon
});
module.exports = __toCommonJS(arrow_big_up_dash_exports);
var import_create_icon = require("../../create-icon.js");
const ArrowBigUpDashIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ArrowBigUpDashIcon", [["path", { "d": "M14 16a1 1 0 0 0 1-1v-2a1 1 0 0 1 1-1h3.293a.707.707 0 0 0 .5-1.207l-6.939-6.939a1.207 1.207 0 0 0-1.708 0l-6.94 6.94a.707.707 0 0 0 .5 1.206H8a1 1 0 0 1 1 1v2a1 1 0 0 0 1 1z" }], ["path", { "d": "M9 20h6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ArrowBigUpDashIcon
});

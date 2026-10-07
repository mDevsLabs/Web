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
var arrow_back_up_double_exports = {};
__export(arrow_back_up_double_exports, {
  ArrowBackUpDoubleIcon: () => ArrowBackUpDoubleIcon
});
module.exports = __toCommonJS(arrow_back_up_double_exports);
var import_create_icon = require("../../create-icon.cjs");
const ArrowBackUpDoubleIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ArrowBackUpDoubleIcon", [["path", { "d": "M13 14l-4 -4l4 -4" }], ["path", { "d": "M8 14l-4 -4l4 -4" }], ["path", { "d": "M9 10h7a4 4 0 1 1 0 8h-1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ArrowBackUpDoubleIcon
});

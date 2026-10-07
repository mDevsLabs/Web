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
var exposure_minus_2_exports = {};
__export(exposure_minus_2_exports, {
  ExposureMinus2Icon: () => ExposureMinus2Icon
});
module.exports = __toCommonJS(exposure_minus_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const ExposureMinus2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ExposureMinus2Icon", [["path", { "d": "M12 9a4 4 0 1 1 8 0c0 1.098 -.564 2.025 -1.159 2.815l-6.841 7.185h8" }], ["path", { "d": "M3 12h6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ExposureMinus2Icon
});

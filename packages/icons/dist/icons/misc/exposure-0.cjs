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
var exposure_0_exports = {};
__export(exposure_0_exports, {
  Exposure0Icon: () => Exposure0Icon
});
module.exports = __toCommonJS(exposure_0_exports);
var import_create_icon = require("../../create-icon.cjs");
const Exposure0Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Exposure0Icon", [["path", { "d": "M12 19a4 4 0 0 0 4 -4v-6a4 4 0 1 0 -8 0v6a4 4 0 0 0 4 4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Exposure0Icon
});

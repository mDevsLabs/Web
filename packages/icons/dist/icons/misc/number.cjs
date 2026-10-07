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
var number_exports = {};
__export(number_exports, {
  NumberIcon: () => NumberIcon
});
module.exports = __toCommonJS(number_exports);
var import_create_icon = require("../../create-icon.cjs");
const NumberIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("NumberIcon", [["path", { "d": "M4 17v-10l7 10v-10" }], ["path", { "d": "M15 17h5" }], ["path", { "d": "M15 10a2.5 3 0 1 0 5 0a2.5 3 0 1 0 -5 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  NumberIcon
});

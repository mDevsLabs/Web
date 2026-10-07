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
var bread_off_exports = {};
__export(bread_off_exports, {
  BreadOffIcon: () => BreadOffIcon
});
module.exports = __toCommonJS(bread_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const BreadOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BreadOffIcon", [["path", { "d": "M8 4l10 .005v-.005a3 3 0 0 1 2 5.235v6.765m-.59 3.418c-.36 .36 -.86 .582 -1.41 .582h-12a2 2 0 0 1 -2 -2v-8.764a3 3 0 0 1 .418 -4.785" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BreadOffIcon
});

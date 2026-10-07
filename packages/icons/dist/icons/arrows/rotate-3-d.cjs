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
var rotate_3_d_exports = {};
__export(rotate_3_d_exports, {
  Rotate3DIcon: () => Rotate3DIcon
});
module.exports = __toCommonJS(rotate_3_d_exports);
var import_create_icon = require("../../create-icon.cjs");
const Rotate3DIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Rotate3DIcon", [["path", { "d": "m15.194 13.707 3.814 1.86-1.86 3.814" }], ["path", { "d": "M16.47214 7.52786 A 5 10 0 1 0 13 21.79796" }], ["path", { "d": "M21.79796 11 A 10 5 0 1 0 19 15.57071" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Rotate3DIcon
});

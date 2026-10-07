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
var cupcake_exports = {};
__export(cupcake_exports, {
  CupcakeIcon: () => CupcakeIcon
});
module.exports = __toCommonJS(cupcake_exports);
var import_create_icon = require("../../create-icon.cjs");
const CupcakeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CupcakeIcon", [["path", { "d": "M12 22v-9" }], ["path", { "d": "M14 4h1a3 3 0 013 3l-.004.125A4 4 0 0121 11v2" }], ["path", { "d": "m15.5 22 1.5-9" }], ["path", { "d": "M21 13a1 1 0 01.919 1.394l-2.74 6.394A2 2 0 0117.34 22H6.659a2 2 0 01-1.838-1.212l-2.74-6.394A1 1 0 013 13z" }], ["path", { "d": "M3 13v-2a4 4 0 013.003-3.875L6 7a3 3 0 013-3h1" }], ["path", { "d": "M8.5 22 7 13" }], ["circle", { "cx": "12", "cy": "4", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CupcakeIcon
});

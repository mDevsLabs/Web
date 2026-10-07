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
var mouth_off_exports = {};
__export(mouth_off_exports, {
  MouthOffIcon: () => MouthOffIcon
});
module.exports = __toCommonJS(mouth_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const MouthOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MouthOffIcon", [["path", { "d": "M13.074 7.417a2.6 2.6 0 012.989.099c1.829 1.36 3.053 2.076 5.479 3.644a1 1 0 01.308 1.368 11.6 11.6 0 01-1.617 2.05" }], ["path", { "d": "M2 12a50.5 50.5 0 0010.99.99" }], ["path", { "d": "m2 2 20 20" }], ["path", { "d": "M21 11a1 1 0 011 1 51 51 0 01-3.734.61" }], ["path", { "d": "M7.695 7.695c-1.7 1.247-2.92 1.967-5.238 3.464a1 1 0 00-.307 1.369 11.6 11.6 0 0014.766 4.388" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MouthOffIcon
});

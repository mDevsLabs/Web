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
var candy_cane_exports = {};
__export(candy_cane_exports, {
  CandyCaneIcon: () => CandyCaneIcon
});
module.exports = __toCommonJS(candy_cane_exports);
var import_create_icon = require("../../create-icon.cjs");
const CandyCaneIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CandyCaneIcon", [["path", { "d": "m10.8 5 2.111 4.223" }], ["path", { "d": "M17.75 7 15 2.1" }], ["path", { "d": "m4.874 14.647 2.12 4.24" }], ["path", { "d": "M5.7 21a2 2 0 0 1-3.5-2l8.6-14a6 6 0 0 1 10.4 6 2 2 0 1 1-3.464-2 2 2 0 1 0-3.464-2z" }], ["path", { "d": "m7.906 9.712 2.005 4.411" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CandyCaneIcon
});

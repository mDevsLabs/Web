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
var candy_off_exports = {};
__export(candy_off_exports, {
  CandyOffIcon: () => CandyOffIcon
});
module.exports = __toCommonJS(candy_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const CandyOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CandyOffIcon", [["path", { "d": "M10 10v7.9" }], ["path", { "d": "M11.802 6.145a5 5 0 0 1 6.053 6.053" }], ["path", { "d": "M14 6.1v2.243" }], ["path", { "d": "m15.5 15.571-.964.964a5 5 0 0 1-7.071 0 5 5 0 0 1 0-7.07l.964-.965" }], ["path", { "d": "M16 7V3a1 1 0 0 1 1.707-.707 2.5 2.5 0 0 0 2.152.717 1 1 0 0 1 1.131 1.131 2.5 2.5 0 0 0 .717 2.152A1 1 0 0 1 21 8h-4" }], ["path", { "d": "m2 2 20 20" }], ["path", { "d": "M8 17v4a1 1 0 0 1-1.707.707 2.5 2.5 0 0 0-2.152-.717 1 1 0 0 1-1.131-1.131 2.5 2.5 0 0 0-.717-2.152A1 1 0 0 1 3 16h4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CandyOffIcon
});

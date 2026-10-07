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
var germ_exports = {};
__export(germ_exports, {
  GermIcon: () => GermIcon
});
module.exports = __toCommonJS(germ_exports);
var import_create_icon = require("../../create-icon.cjs");
const GermIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("GermIcon", [["path", { "d": "m11 2 .925 1.848" }], ["path", { "d": "M13 15h.01" }], ["path", { "d": "m16 21-1-2.472" }], ["path", { "d": "m19 2-1 1.804" }], ["path", { "d": "m2 19 2.746-1.373" }], ["path", { "d": "m22 16-2.474-2.13" }], ["path", { "d": "m22 5-1.804 1" }], ["path", { "d": "m3 10 2 2" }], ["path", { "d": "M9 16h.01" }], ["path", { "d": "M9 20v2" }], ["path", { "d": "M9.33 7.035c-.51 1.478-1.786 2.93-3.09 3.794A5 5 0 009 20a12.1 12.1 0 0011.902-9.916A6 6 0 009.33 7.035" }], ["circle", { "cx": "15", "cy": "9", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GermIcon
});

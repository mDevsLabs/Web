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
var mic_2_exports = {};
__export(mic_2_exports, {
  Mic2Icon: () => Mic2Icon
});
module.exports = __toCommonJS(mic_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const Mic2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Mic2Icon", [["path", { "d": "m11 7.601-5.994 8.19a1 1 0 0 0 .1 1.298l.817.818a1 1 0 0 0 1.314.087L15.09 12" }], ["path", { "d": "M16.5 21.174C15.5 20.5 14.372 20 13 20c-2.058 0-3.928 2.356-6 2-2.072-.356-2.775-3.369-1.5-4.5" }], ["circle", { "cx": "16", "cy": "7", "r": "5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Mic2Icon
});

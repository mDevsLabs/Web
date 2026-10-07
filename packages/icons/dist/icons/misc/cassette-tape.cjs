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
var cassette_tape_exports = {};
__export(cassette_tape_exports, {
  CassetteTapeIcon: () => CassetteTapeIcon
});
module.exports = __toCommonJS(cassette_tape_exports);
var import_create_icon = require("../../create-icon.cjs");
const CassetteTapeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CassetteTapeIcon", [["rect", { "width": "20", "height": "16", "x": "2", "y": "4", "rx": "2" }], ["circle", { "cx": "8", "cy": "10", "r": "2" }], ["path", { "d": "M8 12h8" }], ["circle", { "cx": "16", "cy": "10", "r": "2" }], ["path", { "d": "m6 20 .7-2.9A1.4 1.4 0 0 1 8.1 16h7.8a1.4 1.4 0 0 1 1.4 1l.7 3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CassetteTapeIcon
});

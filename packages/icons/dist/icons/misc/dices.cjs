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
var dices_exports = {};
__export(dices_exports, {
  DicesIcon: () => DicesIcon
});
module.exports = __toCommonJS(dices_exports);
var import_create_icon = require("../../create-icon.cjs");
const DicesIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("DicesIcon", [["rect", { "width": "12", "height": "12", "x": "2", "y": "10", "rx": "2", "ry": "2" }], ["path", { "d": "m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6" }], ["path", { "d": "M6 18h.01" }], ["path", { "d": "M10 14h.01" }], ["path", { "d": "M15 6h.01" }], ["path", { "d": "M18 9h.01" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DicesIcon
});

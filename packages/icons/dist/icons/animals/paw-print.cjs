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
var paw_print_exports = {};
__export(paw_print_exports, {
  PawPrintIcon: () => PawPrintIcon
});
module.exports = __toCommonJS(paw_print_exports);
var import_create_icon = require("../../create-icon.js");
const PawPrintIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("PawPrintIcon", [["circle", { "cx": "11", "cy": "4", "r": "2" }], ["circle", { "cx": "18", "cy": "8", "r": "2" }], ["circle", { "cx": "20", "cy": "16", "r": "2" }], ["path", { "d": "M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PawPrintIcon
});

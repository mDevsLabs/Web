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
var printer_check_exports = {};
__export(printer_check_exports, {
  PrinterCheckIcon: () => PrinterCheckIcon
});
module.exports = __toCommonJS(printer_check_exports);
var import_create_icon = require("../../create-icon.cjs");
const PrinterCheckIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("PrinterCheckIcon", [["path", { "d": "M13.5 22H7a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v.5" }], ["path", { "d": "m16 19 2 2 4-4" }], ["path", { "d": "M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2" }], ["path", { "d": "M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PrinterCheckIcon
});

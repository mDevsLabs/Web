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
var printer_3d_exports = {};
__export(printer_3d_exports, {
  Printer3dIcon: () => Printer3dIcon
});
module.exports = __toCommonJS(printer_3d_exports);
var import_create_icon = require("../../create-icon.cjs");
const Printer3dIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Printer3dIcon", [["path", { "d": "M10 11v1" }], ["path", { "d": "M12 8h8" }], ["path", { "d": "M15 20v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3" }], ["path", { "d": "M4 20h16" }], ["path", { "d": "M4 22V4a2 2 0 012-2h12a2 2 0 012 2v18" }], ["path", { "d": "M4 8h4" }], ["path", { "d": "M8.635 10.093A2 2 0 018 8.631V7a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-.293.707l-1 1a1 1 0 01-1.414 0z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Printer3dIcon
});

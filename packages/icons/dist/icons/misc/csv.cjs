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
var csv_exports = {};
__export(csv_exports, {
  CsvIcon: () => CsvIcon
});
module.exports = __toCommonJS(csv_exports);
var import_create_icon = require("../../create-icon.cjs");
const CsvIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CsvIcon", [["path", { "d": "M10 15a1 1 0 0 0 1 1h2a1 1 0 0 0 1 -1v-2a1 1 0 0 0 -1 -1h-2a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1" }], ["path", { "d": "M17 8l2 8l2 -8" }], ["path", { "d": "M7 10a2 2 0 1 0 -4 0v4a2 2 0 1 0 4 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CsvIcon
});

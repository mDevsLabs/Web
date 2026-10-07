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
var zip_exports = {};
__export(zip_exports, {
  ZipIcon: () => ZipIcon
});
module.exports = __toCommonJS(zip_exports);
var import_create_icon = require("../../create-icon.cjs");
const ZipIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ZipIcon", [["path", { "d": "M16 16v-8h2a2 2 0 1 1 0 4h-2" }], ["path", { "d": "M12 8v8" }], ["path", { "d": "M4 8h4l-4 8h4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ZipIcon
});

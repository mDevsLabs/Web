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
var sailboat_exports = {};
__export(sailboat_exports, {
  SailboatIcon: () => SailboatIcon
});
module.exports = __toCommonJS(sailboat_exports);
var import_create_icon = require("../../create-icon.cjs");
const SailboatIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SailboatIcon", [["path", { "d": "M10 2v15" }], ["path", { "d": "M7 22a4 4 0 0 1-4-4 1 1 0 0 1 1-1h16a1 1 0 0 1 1 1 4 4 0 0 1-4 4z" }], ["path", { "d": "M9.159 2.46a1 1 0 0 1 1.521-.193l9.977 8.98A1 1 0 0 1 20 13H4a1 1 0 0 1-.824-1.567z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SailboatIcon
});

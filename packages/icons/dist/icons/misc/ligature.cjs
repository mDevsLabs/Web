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
var ligature_exports = {};
__export(ligature_exports, {
  LigatureIcon: () => LigatureIcon
});
module.exports = __toCommonJS(ligature_exports);
var import_create_icon = require("../../create-icon.cjs");
const LigatureIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("LigatureIcon", [["path", { "d": "M14 12h2v8" }], ["path", { "d": "M14 20h4" }], ["path", { "d": "M6 12h4" }], ["path", { "d": "M6 20h4" }], ["path", { "d": "M8 20V8a4 4 0 0 1 7.464-2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LigatureIcon
});

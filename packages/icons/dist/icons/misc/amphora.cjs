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
var amphora_exports = {};
__export(amphora_exports, {
  AmphoraIcon: () => AmphoraIcon
});
module.exports = __toCommonJS(amphora_exports);
var import_create_icon = require("../../create-icon.cjs");
const AmphoraIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AmphoraIcon", [["path", { "d": "M10 2v5.632c0 .424-.272.795-.653.982A6 6 0 0 0 6 14c.006 4 3 7 5 8" }], ["path", { "d": "M10 5H8a2 2 0 0 0 0 4h.68" }], ["path", { "d": "M14 2v5.632c0 .424.272.795.652.982A6 6 0 0 1 18 14c0 4-3 7-5 8" }], ["path", { "d": "M14 5h2a2 2 0 0 1 0 4h-.68" }], ["path", { "d": "M18 22H6" }], ["path", { "d": "M9 2h6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AmphoraIcon
});

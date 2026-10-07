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
var cactus_off_exports = {};
__export(cactus_off_exports, {
  CactusOffIcon: () => CactusOffIcon
});
module.exports = __toCommonJS(cactus_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const CactusOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CactusOffIcon", [["path", { "d": "M6 9v1a3 3 0 0 0 3 3h1" }], ["path", { "d": "M18 8v5a3 3 0 0 1 -.129 .872m-2.014 2a3 3 0 0 1 -.857 .124h-1" }], ["path", { "d": "M10 21v-11m0 -4v-1a2 2 0 1 1 4 0v5m0 4v7" }], ["path", { "d": "M7 21h10" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CactusOffIcon
});

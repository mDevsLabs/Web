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
var cactus_exports = {};
__export(cactus_exports, {
  CactusIcon: () => CactusIcon
});
module.exports = __toCommonJS(cactus_exports);
var import_create_icon = require("../../create-icon.cjs");
const CactusIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CactusIcon", [["path", { "d": "M6 9v1a3 3 0 0 0 3 3h1" }], ["path", { "d": "M18 8v5a3 3 0 0 1 -3 3h-1" }], ["path", { "d": "M10 21v-16a2 2 0 1 1 4 0v16" }], ["path", { "d": "M7 21h10" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CactusIcon
});

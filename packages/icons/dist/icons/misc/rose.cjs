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
var rose_exports = {};
__export(rose_exports, {
  RoseIcon: () => RoseIcon
});
module.exports = __toCommonJS(rose_exports);
var import_create_icon = require("../../create-icon.cjs");
const RoseIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("RoseIcon", [["path", { "d": "M17 10h-1a4 4 0 1 1 4-4v.534" }], ["path", { "d": "M17 6h1a4 4 0 0 1 1.42 7.74l-2.29.87a6 6 0 0 1-5.339-10.68l2.069-1.31" }], ["path", { "d": "M4.5 17c2.8-.5 4.4 0 5.5.8s1.8 2.2 2.3 3.7c-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2" }], ["path", { "d": "M9.77 12C4 15 2 22 2 22" }], ["circle", { "cx": "17", "cy": "8", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RoseIcon
});

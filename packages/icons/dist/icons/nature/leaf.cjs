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
var leaf_exports = {};
__export(leaf_exports, {
  LeafIcon: () => LeafIcon
});
module.exports = __toCommonJS(leaf_exports);
var import_create_icon = require("../../create-icon.cjs");
const LeafIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("LeafIcon", [["path", { "d": "M11 20a10 10 0 0010-10 25.9 25.9 0 00-1.04-7.281 1 1 0 00-1.755-.325C15.833 5.5 13 5.5 9.8 6.1A7 7 0 0011 20" }], ["path", { "d": "M2 21a5 5 0 012.911-4.544C7.613 15.212 8.351 15.24 11 13" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LeafIcon
});

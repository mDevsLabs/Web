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
var combine_exports = {};
__export(combine_exports, {
  CombineIcon: () => CombineIcon
});
module.exports = __toCommonJS(combine_exports);
var import_create_icon = require("../../create-icon.cjs");
const CombineIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CombineIcon", [["path", { "d": "M14 3a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1" }], ["path", { "d": "M19 3a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1" }], ["path", { "d": "m7 15 3 3" }], ["path", { "d": "m7 21 3-3H5a2 2 0 0 1-2-2v-2" }], ["rect", { "x": "14", "y": "14", "width": "7", "height": "7", "rx": "1" }], ["rect", { "x": "3", "y": "3", "width": "7", "height": "7", "rx": "1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CombineIcon
});

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
var category_2_exports = {};
__export(category_2_exports, {
  Category2Icon: () => Category2Icon
});
module.exports = __toCommonJS(category_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const Category2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Category2Icon", [["path", { "d": "M14 4h6v6h-6l0 -6" }], ["path", { "d": "M4 14h6v6h-6l0 -6" }], ["path", { "d": "M14 17a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" }], ["path", { "d": "M4 7a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Category2Icon
});

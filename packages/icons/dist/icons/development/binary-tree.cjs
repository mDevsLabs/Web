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
var binary_tree_exports = {};
__export(binary_tree_exports, {
  BinaryTreeIcon: () => BinaryTreeIcon
});
module.exports = __toCommonJS(binary_tree_exports);
var import_create_icon = require("../../create-icon.cjs");
const BinaryTreeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BinaryTreeIcon", [["path", { "d": "M6 20a2 2 0 1 0 -4 0a2 2 0 0 0 4 0" }], ["path", { "d": "M16 4a2 2 0 1 0 -4 0a2 2 0 0 0 4 0" }], ["path", { "d": "M16 20a2 2 0 1 0 -4 0a2 2 0 0 0 4 0" }], ["path", { "d": "M11 12a2 2 0 1 0 -4 0a2 2 0 0 0 4 0" }], ["path", { "d": "M21 12a2 2 0 1 0 -4 0a2 2 0 0 0 4 0" }], ["path", { "d": "M5.058 18.306l2.88 -4.606" }], ["path", { "d": "M10.061 10.303l2.877 -4.604" }], ["path", { "d": "M10.065 13.705l2.876 4.6" }], ["path", { "d": "M15.063 5.7l2.881 4.61" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BinaryTreeIcon
});

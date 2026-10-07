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
var tree_deciduous_exports = {};
__export(tree_deciduous_exports, {
  TreeDeciduousIcon: () => TreeDeciduousIcon
});
module.exports = __toCommonJS(tree_deciduous_exports);
var import_create_icon = require("../../create-icon.cjs");
const TreeDeciduousIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("TreeDeciduousIcon", [["path", { "d": "M8 19a4 4 0 0 1-2.24-7.32A3.5 3.5 0 0 1 9 6.03V6a3 3 0 1 1 6 0v.04a3.5 3.5 0 0 1 3.24 5.65A4 4 0 0 1 16 19Z" }], ["path", { "d": "M12 19v3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TreeDeciduousIcon
});

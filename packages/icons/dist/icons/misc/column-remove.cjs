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
var column_remove_exports = {};
__export(column_remove_exports, {
  ColumnRemoveIcon: () => ColumnRemoveIcon
});
module.exports = __toCommonJS(column_remove_exports);
var import_create_icon = require("../../create-icon.cjs");
const ColumnRemoveIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ColumnRemoveIcon", [["path", { "d": "M6 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-14a1 1 0 0 1 1 -1" }], ["path", { "d": "M16 10l4 4" }], ["path", { "d": "M16 14l4 -4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ColumnRemoveIcon
});

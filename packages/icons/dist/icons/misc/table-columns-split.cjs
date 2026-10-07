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
var table_columns_split_exports = {};
__export(table_columns_split_exports, {
  TableColumnsSplitIcon: () => TableColumnsSplitIcon
});
module.exports = __toCommonJS(table_columns_split_exports);
var import_create_icon = require("../../create-icon.cjs");
const TableColumnsSplitIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("TableColumnsSplitIcon", [["path", { "d": "M14 14v2" }], ["path", { "d": "M14 20v2" }], ["path", { "d": "M14 2v2" }], ["path", { "d": "M14 8v2" }], ["path", { "d": "M2 15h8" }], ["path", { "d": "M2 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H2" }], ["path", { "d": "M2 9h8" }], ["path", { "d": "M22 15h-4" }], ["path", { "d": "M22 3h-2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h2" }], ["path", { "d": "M22 9h-4" }], ["path", { "d": "M5 3v18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TableColumnsSplitIcon
});

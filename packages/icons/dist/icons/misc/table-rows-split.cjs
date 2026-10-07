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
var table_rows_split_exports = {};
__export(table_rows_split_exports, {
  TableRowsSplitIcon: () => TableRowsSplitIcon
});
module.exports = __toCommonJS(table_rows_split_exports);
var import_create_icon = require("../../create-icon.cjs");
const TableRowsSplitIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("TableRowsSplitIcon", [["path", { "d": "M14 10h2" }], ["path", { "d": "M15 22v-8" }], ["path", { "d": "M15 2v4" }], ["path", { "d": "M2 10h2" }], ["path", { "d": "M20 10h2" }], ["path", { "d": "M3 19h18" }], ["path", { "d": "M3 22v-6a2 2 135 0 1 2-2h14a2 2 45 0 1 2 2v6" }], ["path", { "d": "M3 2v2a2 2 45 0 0 2 2h14a2 2 135 0 0 2-2V2" }], ["path", { "d": "M8 10h2" }], ["path", { "d": "M9 22v-8" }], ["path", { "d": "M9 2v4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TableRowsSplitIcon
});

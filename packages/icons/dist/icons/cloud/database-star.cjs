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
var database_star_exports = {};
__export(database_star_exports, {
  DatabaseStarIcon: () => DatabaseStarIcon
});
module.exports = __toCommonJS(database_star_exports);
var import_create_icon = require("../../create-icon.cjs");
const DatabaseStarIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("DatabaseStarIcon", [["path", { "d": "M4 6c0 1.657 3.582 3 8 3s8 -1.343 8 -3s-3.582 -3 -8 -3s-8 1.343 -8 3" }], ["path", { "d": "M4 6v6c0 1.43 2.67 2.627 6.243 2.927" }], ["path", { "d": "M20 10.5v-4.5" }], ["path", { "d": "M4 12v6c0 1.546 3.12 2.82 7.128 2.982" }], ["path", { "d": "M17.8 20.817l-2.172 1.138a.392 .392 0 0 1 -.568 -.41l.415 -2.411l-1.757 -1.707a.389 .389 0 0 1 .217 -.665l2.428 -.352l1.086 -2.193a.392 .392 0 0 1 .702 0l1.086 2.193l2.428 .352a.39 .39 0 0 1 .217 .665l-1.757 1.707l.414 2.41a.39 .39 0 0 1 -.567 .411l-2.172 -1.138" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DatabaseStarIcon
});

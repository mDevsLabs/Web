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
var database_exclamation_exports = {};
__export(database_exclamation_exports, {
  DatabaseExclamationIcon: () => DatabaseExclamationIcon
});
module.exports = __toCommonJS(database_exclamation_exports);
var import_create_icon = require("../../create-icon.cjs");
const DatabaseExclamationIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("DatabaseExclamationIcon", [["path", { "d": "M4 6c0 1.657 3.582 3 8 3s8 -1.343 8 -3s-3.582 -3 -8 -3s-8 1.343 -8 3" }], ["path", { "d": "M4 6v6c0 1.657 3.582 3 8 3c1.118 0 2.182 -.086 3.148 -.241m4.852 -2.759v-6" }], ["path", { "d": "M4 12v6c0 1.657 3.582 3 8 3c1.064 0 2.079 -.078 3.007 -.22" }], ["path", { "d": "M19 16v3" }], ["path", { "d": "M19 22v.01" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DatabaseExclamationIcon
});

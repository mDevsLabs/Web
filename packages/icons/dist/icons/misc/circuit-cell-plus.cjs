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
var circuit_cell_plus_exports = {};
__export(circuit_cell_plus_exports, {
  CircuitCellPlusIcon: () => CircuitCellPlusIcon
});
module.exports = __toCommonJS(circuit_cell_plus_exports);
var import_create_icon = require("../../create-icon.cjs");
const CircuitCellPlusIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CircuitCellPlusIcon", [["path", { "d": "M2 12h9" }], ["path", { "d": "M15 12h7" }], ["path", { "d": "M11 5v14" }], ["path", { "d": "M15 9v6" }], ["path", { "d": "M3 5h4" }], ["path", { "d": "M5 3v4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CircuitCellPlusIcon
});

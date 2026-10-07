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
var circuit_board_exports = {};
__export(circuit_board_exports, {
  CircuitBoardIcon: () => CircuitBoardIcon
});
module.exports = __toCommonJS(circuit_board_exports);
var import_create_icon = require("../../create-icon.cjs");
const CircuitBoardIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CircuitBoardIcon", [["rect", { "width": "18", "height": "18", "x": "3", "y": "3", "rx": "2" }], ["path", { "d": "M11 9h4a2 2 0 0 0 2-2V3" }], ["circle", { "cx": "9", "cy": "9", "r": "2" }], ["path", { "d": "M7 21v-4a2 2 0 0 1 2-2h4" }], ["circle", { "cx": "15", "cy": "15", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CircuitBoardIcon
});

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
var circuit_switch_closed_exports = {};
__export(circuit_switch_closed_exports, {
  CircuitSwitchClosedIcon: () => CircuitSwitchClosedIcon
});
module.exports = __toCommonJS(circuit_switch_closed_exports);
var import_create_icon = require("../../create-icon.cjs");
const CircuitSwitchClosedIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CircuitSwitchClosedIcon", [["path", { "d": "M2 12h2" }], ["path", { "d": "M20 12h2" }], ["path", { "d": "M4 12a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }], ["path", { "d": "M16 12a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }], ["path", { "d": "M8 12h8" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CircuitSwitchClosedIcon
});

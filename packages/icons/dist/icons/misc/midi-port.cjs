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
var midi_port_exports = {};
__export(midi_port_exports, {
  MidiPortIcon: () => MidiPortIcon
});
module.exports = __toCommonJS(midi_port_exports);
var import_create_icon = require("../../create-icon.cjs");
const MidiPortIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MidiPortIcon", [["path", { "d": "M12 18h.01" }], ["path", { "d": "M15 2.458V5a1 1 0 01-1 1h-4a1 1 0 01-1-1V2.458" }], ["path", { "d": "M16 16h.01" }], ["path", { "d": "M18 12h.01" }], ["path", { "d": "M6 12h.01" }], ["path", { "d": "M8 16h.01" }], ["circle", { "cx": "12", "cy": "12", "r": "10" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MidiPortIcon
});

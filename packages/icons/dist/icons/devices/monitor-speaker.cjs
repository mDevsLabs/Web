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
var monitor_speaker_exports = {};
__export(monitor_speaker_exports, {
  MonitorSpeakerIcon: () => MonitorSpeakerIcon
});
module.exports = __toCommonJS(monitor_speaker_exports);
var import_create_icon = require("../../create-icon.cjs");
const MonitorSpeakerIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MonitorSpeakerIcon", [["path", { "d": "M5.5 20H8" }], ["path", { "d": "M17 9h.01" }], ["rect", { "width": "10", "height": "16", "x": "12", "y": "4", "rx": "2" }], ["path", { "d": "M8 6H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4" }], ["circle", { "cx": "17", "cy": "15", "r": "1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MonitorSpeakerIcon
});

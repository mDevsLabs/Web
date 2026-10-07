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
var monitor_pc_exports = {};
__export(monitor_pc_exports, {
  MonitorPcIcon: () => MonitorPcIcon
});
module.exports = __toCommonJS(monitor_pc_exports);
var import_create_icon = require("../../create-icon.cjs");
const MonitorPcIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MonitorPcIcon", [["path", { "d": "M10 15H4a2 2 0 01-2-2V7a2 2 0 012-2h6" }], ["path", { "d": "M10 19H5" }], ["path", { "d": "M14 11h8" }], ["path", { "d": "M14 7h8" }], ["path", { "d": "M18 17h.01" }], ["path", { "d": "M9 19v-4" }], ["rect", { "x": "14", "y": "3", "width": "8", "height": "18", "rx": "1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MonitorPcIcon
});

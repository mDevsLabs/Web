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
var monitor_pause_exports = {};
__export(monitor_pause_exports, {
  MonitorPauseIcon: () => MonitorPauseIcon
});
module.exports = __toCommonJS(monitor_pause_exports);
var import_create_icon = require("../../create-icon.cjs");
const MonitorPauseIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MonitorPauseIcon", [["path", { "d": "M10 13V7" }], ["path", { "d": "M14 13V7" }], ["rect", { "width": "20", "height": "14", "x": "2", "y": "3", "rx": "2" }], ["path", { "d": "M12 17v4" }], ["path", { "d": "M8 21h8" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MonitorPauseIcon
});

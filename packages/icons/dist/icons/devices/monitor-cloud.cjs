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
var monitor_cloud_exports = {};
__export(monitor_cloud_exports, {
  MonitorCloudIcon: () => MonitorCloudIcon
});
module.exports = __toCommonJS(monitor_cloud_exports);
var import_create_icon = require("../../create-icon.cjs");
const MonitorCloudIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MonitorCloudIcon", [["path", { "d": "M11 13a3 3 0 1 1 2.83-4H14a2 2 0 0 1 0 4z" }], ["path", { "d": "M12 17v4" }], ["path", { "d": "M8 21h8" }], ["rect", { "x": "2", "y": "3", "width": "20", "height": "14", "rx": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MonitorCloudIcon
});

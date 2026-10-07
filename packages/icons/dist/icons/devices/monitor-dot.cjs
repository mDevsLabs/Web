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
var monitor_dot_exports = {};
__export(monitor_dot_exports, {
  MonitorDotIcon: () => MonitorDotIcon
});
module.exports = __toCommonJS(monitor_dot_exports);
var import_create_icon = require("../../create-icon.cjs");
const MonitorDotIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MonitorDotIcon", [["path", { "d": "M12 17v4" }], ["path", { "d": "M22 12.307V15a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8.693" }], ["path", { "d": "M8 21h8" }], ["circle", { "cx": "19", "cy": "6", "r": "3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MonitorDotIcon
});

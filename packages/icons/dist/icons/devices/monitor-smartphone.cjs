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
var monitor_smartphone_exports = {};
__export(monitor_smartphone_exports, {
  MonitorSmartphoneIcon: () => MonitorSmartphoneIcon
});
module.exports = __toCommonJS(monitor_smartphone_exports);
var import_create_icon = require("../../create-icon.cjs");
const MonitorSmartphoneIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MonitorSmartphoneIcon", [["path", { "d": "M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h8" }], ["path", { "d": "M10 19v-3.96 3.15" }], ["path", { "d": "M7 19h5" }], ["rect", { "width": "6", "height": "10", "x": "16", "y": "12", "rx": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MonitorSmartphoneIcon
});

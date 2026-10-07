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
var monitor_off_exports = {};
__export(monitor_off_exports, {
  MonitorOffIcon: () => MonitorOffIcon
});
module.exports = __toCommonJS(monitor_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const MonitorOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MonitorOffIcon", [["path", { "d": "M12 17v4" }], ["path", { "d": "M17 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 1.184-1.826" }], ["path", { "d": "m2 2 20 20" }], ["path", { "d": "M8 21h8" }], ["path", { "d": "M8.656 3H20a2 2 0 0 1 2 2v10a2 2 0 0 1-.293 1.042" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MonitorOffIcon
});

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
var calendar_sync_exports = {};
__export(calendar_sync_exports, {
  CalendarSyncIcon: () => CalendarSyncIcon
});
module.exports = __toCommonJS(calendar_sync_exports);
var import_create_icon = require("../../create-icon.cjs");
const CalendarSyncIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CalendarSyncIcon", [["path", { "d": "M11 10v4h4" }], ["path", { "d": "m11 14 1.535-1.605a5 5 0 018 1.5" }], ["path", { "d": "M16 2v3" }], ["path", { "d": "m21 18-1.535 1.605a5 5 0 01-8-1.5" }], ["path", { "d": "M21 22v-4h-4" }], ["path", { "d": "M21 8.517V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h3.517" }], ["path", { "d": "M3 9h4" }], ["path", { "d": "M8 2v3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CalendarSyncIcon
});

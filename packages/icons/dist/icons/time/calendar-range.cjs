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
var calendar_range_exports = {};
__export(calendar_range_exports, {
  CalendarRangeIcon: () => CalendarRangeIcon
});
module.exports = __toCommonJS(calendar_range_exports);
var import_create_icon = require("../../create-icon.cjs");
const CalendarRangeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CalendarRangeIcon", [["rect", { "x": "3", "y": "3", "width": "18", "height": "18", "rx": "2" }], ["path", { "d": "M16 2v3" }], ["path", { "d": "M3 9h18" }], ["path", { "d": "M8 2v3" }], ["path", { "d": "M17 13h-6" }], ["path", { "d": "M13 17H7" }], ["path", { "d": "M7 13h.01" }], ["path", { "d": "M17 17h.01" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CalendarRangeIcon
});

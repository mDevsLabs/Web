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
var calendar_off_exports = {};
__export(calendar_off_exports, {
  CalendarOffIcon: () => CalendarOffIcon
});
module.exports = __toCommonJS(calendar_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const CalendarOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CalendarOffIcon", [["path", { "d": "M16 2v3" }], ["path", { "d": "m2 2 20 20" }], ["path", { "d": "M21 9h-5.5" }], ["path", { "d": "M3 9h6" }], ["path", { "d": "M3.586 3.586A2 2 0 003 5v14a2 2 0 002 2h14a2 2 0 001.414-.586" }], ["path", { "d": "M8.656 3H19a2 2 0 012 2v10.344" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CalendarOffIcon
});

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
var calendar_check_2_exports = {};
__export(calendar_check_2_exports, {
  CalendarCheck2Icon: () => CalendarCheck2Icon
});
module.exports = __toCommonJS(calendar_check_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const CalendarCheck2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CalendarCheck2Icon", [["path", { "d": "M 19 3 L 5 3" }], ["path", { "d": "M 21 13 L 21 5" }], ["path", { "d": "M 21 5 A2 2 0 0 0 19 3" }], ["path", { "d": "M 3 19 A2 2 0 0 0 5 21" }], ["path", { "d": "M 3 5 L 3 19" }], ["path", { "d": "M 5 3 A2 2 0 0 0 3 5" }], ["path", { "d": "m16 19 2 2 4-4" }], ["path", { "d": "M16 2v3" }], ["path", { "d": "M3 9h18" }], ["path", { "d": "M5 21 L12.5 21" }], ["path", { "d": "M8 2v3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CalendarCheck2Icon
});

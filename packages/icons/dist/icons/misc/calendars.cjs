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
var calendars_exports = {};
__export(calendars_exports, {
  CalendarsIcon: () => CalendarsIcon
});
module.exports = __toCommonJS(calendars_exports);
var import_create_icon = require("../../create-icon.cjs");
const CalendarsIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CalendarsIcon", [["path", { "d": "M12 2v2" }], ["path", { "d": "M15.726 21.01A2 2 0 0 1 14 22H4a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2" }], ["path", { "d": "M18 2v2" }], ["path", { "d": "M2 13h2" }], ["path", { "d": "M8 8h14" }], ["rect", { "x": "8", "y": "3", "width": "14", "height": "14", "rx": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CalendarsIcon
});

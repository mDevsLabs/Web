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
var timeline_exports = {};
__export(timeline_exports, {
  TimelineIcon: () => TimelineIcon
});
module.exports = __toCommonJS(timeline_exports);
var import_create_icon = require("../../create-icon.cjs");
const TimelineIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("TimelineIcon", [["path", { "d": "M4 12h.01" }], ["path", { "d": "M4 16h.01" }], ["path", { "d": "M4 20h.01" }], ["path", { "d": "M4 4h.01" }], ["path", { "d": "M4 8h.01" }], ["path", { "d": "M9.414 13.414a2 2 0 0 0 1.414.586H19a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-8.172a2 2 0 0 0-1.414.586L8 12z" }], ["path", { "d": "M9.414 21.414a2 2 0 0 0 1.414.586H19a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-8.172a2 2 0 0 0-1.414.586L8 20z" }], ["path", { "d": "M9.414 5.414A2 2 0 0 0 10.828 6H19a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1h-8.172a2 2 0 0 0-1.414.586L8 4z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TimelineIcon
});

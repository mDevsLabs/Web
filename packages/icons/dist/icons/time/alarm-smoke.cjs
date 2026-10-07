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
var alarm_smoke_exports = {};
__export(alarm_smoke_exports, {
  AlarmSmokeIcon: () => AlarmSmokeIcon
});
module.exports = __toCommonJS(alarm_smoke_exports);
var import_create_icon = require("../../create-icon.cjs");
const AlarmSmokeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AlarmSmokeIcon", [["path", { "d": "M11 21c0-2.5 2-2.5 2-5" }], ["path", { "d": "M16 21c0-2.5 2-2.5 2-5" }], ["path", { "d": "m19 8-.8 3a1.25 1.25 0 0 1-1.2 1H7a1.25 1.25 0 0 1-1.2-1L5 8" }], ["path", { "d": "M21 3a1 1 0 0 1 1 1v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a1 1 0 0 1 1-1z" }], ["path", { "d": "M6 21c0-2.5 2-2.5 2-5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AlarmSmokeIcon
});

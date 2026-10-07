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
var mood_check_exports = {};
__export(mood_check_exports, {
  MoodCheckIcon: () => MoodCheckIcon
});
module.exports = __toCommonJS(mood_check_exports);
var import_create_icon = require("../../create-icon.cjs");
const MoodCheckIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MoodCheckIcon", [["path", { "d": "M20.925 13.163a8.998 8.998 0 0 0 -8.925 -10.163a9 9 0 0 0 0 18" }], ["path", { "d": "M9 10h.01" }], ["path", { "d": "M15 10h.01" }], ["path", { "d": "M9.5 15c.658 .64 1.56 1 2.5 1s1.842 -.36 2.5 -1" }], ["path", { "d": "M15 19l2 2l4 -4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MoodCheckIcon
});

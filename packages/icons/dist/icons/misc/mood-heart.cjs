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
var mood_heart_exports = {};
__export(mood_heart_exports, {
  MoodHeartIcon: () => MoodHeartIcon
});
module.exports = __toCommonJS(mood_heart_exports);
var import_create_icon = require("../../create-icon.cjs");
const MoodHeartIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MoodHeartIcon", [["path", { "d": "M21 12a9 9 0 1 0 -8.012 8.946" }], ["path", { "d": "M9 10h.01" }], ["path", { "d": "M15 10h.01" }], ["path", { "d": "M9.5 15a3.59 3.59 0 0 0 2.774 .99" }], ["path", { "d": "M18.994 21.5l2.518 -2.58a1.74 1.74 0 0 0 .004 -2.413a1.627 1.627 0 0 0 -2.346 -.005l-.168 .172l-.168 -.172a1.627 1.627 0 0 0 -2.346 -.004a1.74 1.74 0 0 0 -.004 2.412l2.51 2.59" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MoodHeartIcon
});

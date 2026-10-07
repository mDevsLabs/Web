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
var mood_cog_exports = {};
__export(mood_cog_exports, {
  MoodCogIcon: () => MoodCogIcon
});
module.exports = __toCommonJS(mood_cog_exports);
var import_create_icon = require("../../create-icon.cjs");
const MoodCogIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MoodCogIcon", [["path", { "d": "M21 12a9 9 0 1 0 -8.983 9" }], ["path", { "d": "M16.001 18a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }], ["path", { "d": "M18.001 14.5v1.5" }], ["path", { "d": "M18.001 20v1.5" }], ["path", { "d": "M21.032 16.25l-1.299 .75" }], ["path", { "d": "M16.27 19l-1.3 .75" }], ["path", { "d": "M14.97 16.25l1.3 .75" }], ["path", { "d": "M19.733 19l1.3 .75" }], ["path", { "d": "M9 10h.01" }], ["path", { "d": "M15 10h.01" }], ["path", { "d": "M9.5 15c.658 .64 1.56 1 2.5 1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MoodCogIcon
});

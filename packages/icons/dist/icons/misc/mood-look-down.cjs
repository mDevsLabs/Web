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
var mood_look_down_exports = {};
__export(mood_look_down_exports, {
  MoodLookDownIcon: () => MoodLookDownIcon
});
module.exports = __toCommonJS(mood_look_down_exports);
var import_create_icon = require("../../create-icon.cjs");
const MoodLookDownIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MoodLookDownIcon", [["path", { "d": "M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" }], ["path", { "d": "M9 13h.01" }], ["path", { "d": "M15 13h.01" }], ["path", { "d": "M11 17h2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MoodLookDownIcon
});

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
var mood_edit_exports = {};
__export(mood_edit_exports, {
  MoodEditIcon: () => MoodEditIcon
});
module.exports = __toCommonJS(mood_edit_exports);
var import_create_icon = require("../../create-icon.cjs");
const MoodEditIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MoodEditIcon", [["path", { "d": "M20.955 11.104a9 9 0 1 0 -9.895 9.847" }], ["path", { "d": "M9 10h.01" }], ["path", { "d": "M15 10h.01" }], ["path", { "d": "M9.5 15c.658 .672 1.56 1 2.5 1c.126 0 .251 -.006 .376 -.018" }], ["path", { "d": "M18.42 15.61a2.1 2.1 0 0 1 2.97 2.97l-3.39 3.42h-3v-3l3.42 -3.39" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MoodEditIcon
});

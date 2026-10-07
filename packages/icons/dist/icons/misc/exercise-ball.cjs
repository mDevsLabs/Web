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
var exercise_ball_exports = {};
__export(exercise_ball_exports, {
  ExerciseBallIcon: () => ExerciseBallIcon
});
module.exports = __toCommonJS(exercise_ball_exports);
var import_create_icon = require("../../create-icon.cjs");
const ExerciseBallIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ExerciseBallIcon", [["path", { "d": "M5.59 18.31a15.57 15.57 0 0 1 4.51 -9.21a15.9 15.9 0 0 1 7.43 -4.19" }], ["path", { "d": "M11.55 21a9.34 9.34 0 0 1 2.79 -7.65a9.5 9.5 0 0 1 6.54 -2.85" }], ["path", { "d": "M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ExerciseBallIcon
});

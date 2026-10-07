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
var rugby_ball_exports = {};
__export(rugby_ball_exports, {
  RugbyBallIcon: () => RugbyBallIcon
});
module.exports = __toCommonJS(rugby_ball_exports);
var import_create_icon = require("../../create-icon.cjs");
const RugbyBallIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("RugbyBallIcon", [["path", { "d": "m10 10 4 4" }], ["path", { "d": "m13 7 4 4" }], ["path", { "d": "M15.34 2.138A15 15 0 002.138 15.34c-.357 2.94.004 4.919.805 5.717.798.8 2.778 1.162 5.718.805A15 15 0 0021.862 8.661c.357-2.94-.004-4.92-.805-5.718-.798-.8-2.778-1.162-5.717-.805" }], ["path", { "d": "M17 7 7 17" }], ["path", { "d": "m7 13 4 4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RugbyBallIcon
});

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
var ball_baseball_exports = {};
__export(ball_baseball_exports, {
  BallBaseballIcon: () => BallBaseballIcon
});
module.exports = __toCommonJS(ball_baseball_exports);
var import_create_icon = require("../../create-icon.cjs");
const BallBaseballIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BallBaseballIcon", [["path", { "d": "M5.636 18.364a9 9 0 1 0 12.728 -12.728a9 9 0 0 0 -12.728 12.728" }], ["path", { "d": "M12.495 3.02a9 9 0 0 1 -9.475 9.475" }], ["path", { "d": "M20.98 11.505a9 9 0 0 0 -9.475 9.475" }], ["path", { "d": "M9 9l2 2" }], ["path", { "d": "M13 13l2 2" }], ["path", { "d": "M11 7l2 1" }], ["path", { "d": "M7 11l1 2" }], ["path", { "d": "M16 11l1 2" }], ["path", { "d": "M11 16l2 1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BallBaseballIcon
});

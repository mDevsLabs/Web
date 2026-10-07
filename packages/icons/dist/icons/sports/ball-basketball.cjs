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
var ball_basketball_exports = {};
__export(ball_basketball_exports, {
  BallBasketballIcon: () => BallBasketballIcon
});
module.exports = __toCommonJS(ball_basketball_exports);
var import_create_icon = require("../../create-icon.cjs");
const BallBasketballIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BallBasketballIcon", [["path", { "d": "M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" }], ["path", { "d": "M5.65 5.65l12.7 12.7" }], ["path", { "d": "M5.65 18.35l12.7 -12.7" }], ["path", { "d": "M12 3a9 9 0 0 0 9 9" }], ["path", { "d": "M3 12a9 9 0 0 1 9 9" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BallBasketballIcon
});

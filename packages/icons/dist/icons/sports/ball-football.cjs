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
var ball_football_exports = {};
__export(ball_football_exports, {
  BallFootballIcon: () => BallFootballIcon
});
module.exports = __toCommonJS(ball_football_exports);
var import_create_icon = require("../../create-icon.cjs");
const BallFootballIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BallFootballIcon", [["path", { "d": "M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" }], ["path", { "d": "M12 7l4.76 3.45l-1.76 5.55h-6l-1.76 -5.55l4.76 -3.45" }], ["path", { "d": "M12 7v-4m3 13l2.5 3m-.74 -8.55l3.74 -1.45m-11.44 7.05l-2.56 2.95m.74 -8.55l-3.74 -1.45" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BallFootballIcon
});

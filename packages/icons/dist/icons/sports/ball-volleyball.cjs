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
var ball_volleyball_exports = {};
__export(ball_volleyball_exports, {
  BallVolleyballIcon: () => BallVolleyballIcon
});
module.exports = __toCommonJS(ball_volleyball_exports);
var import_create_icon = require("../../create-icon.cjs");
const BallVolleyballIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BallVolleyballIcon", [["path", { "d": "M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" }], ["path", { "d": "M12 12a8 8 0 0 0 8 4" }], ["path", { "d": "M7.5 13.5a12 12 0 0 0 8.5 6.5" }], ["path", { "d": "M12 12a8 8 0 0 0 -7.464 4.928" }], ["path", { "d": "M12.951 7.353a12 12 0 0 0 -9.88 4.111" }], ["path", { "d": "M12 12a8 8 0 0 0 -.536 -8.928" }], ["path", { "d": "M15.549 15.147a12 12 0 0 0 1.38 -10.611" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BallVolleyballIcon
});

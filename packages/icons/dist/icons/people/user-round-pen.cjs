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
var user_round_pen_exports = {};
__export(user_round_pen_exports, {
  UserRoundPenIcon: () => UserRoundPenIcon
});
module.exports = __toCommonJS(user_round_pen_exports);
var import_create_icon = require("../../create-icon.cjs");
const UserRoundPenIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("UserRoundPenIcon", [["path", { "d": "M2 21a8 8 0 0 1 10.821-7.487" }], ["path", { "d": "M21.378 16.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" }], ["circle", { "cx": "10", "cy": "8", "r": "5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  UserRoundPenIcon
});

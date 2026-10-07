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
var user_round_x_exports = {};
__export(user_round_x_exports, {
  UserRoundXIcon: () => UserRoundXIcon
});
module.exports = __toCommonJS(user_round_x_exports);
var import_create_icon = require("../../create-icon.cjs");
const UserRoundXIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("UserRoundXIcon", [["path", { "d": "m16.5 16.5 5 5" }], ["path", { "d": "M2 21a8 8 0 0 1 11.531-7.18" }], ["path", { "d": "m21.5 16.5-5 5" }], ["circle", { "cx": "10", "cy": "8", "r": "5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  UserRoundXIcon
});

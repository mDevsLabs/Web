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
var circle_user_round_exports = {};
__export(circle_user_round_exports, {
  CircleUserRoundIcon: () => CircleUserRoundIcon
});
module.exports = __toCommonJS(circle_user_round_exports);
var import_create_icon = require("../../create-icon.cjs");
const CircleUserRoundIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CircleUserRoundIcon", [["path", { "d": "M17.925 20.056a6 6 0 0 0-11.851.001" }], ["circle", { "cx": "12", "cy": "11", "r": "4" }], ["circle", { "cx": "12", "cy": "12", "r": "10" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CircleUserRoundIcon
});

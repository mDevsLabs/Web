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
var play_off_exports = {};
__export(play_off_exports, {
  PlayOffIcon: () => PlayOffIcon
});
module.exports = __toCommonJS(play_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const PlayOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("PlayOffIcon", [["path", { "d": "m10.215 4.56 9.79 5.71a2 2 0 0 1 .003 3.458l-.393.23" }], ["path", { "d": "m16.042 16.042-8.034 4.686A2 2 0 0 1 5 19V5" }], ["path", { "d": "m2 2 20 20" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PlayOffIcon
});

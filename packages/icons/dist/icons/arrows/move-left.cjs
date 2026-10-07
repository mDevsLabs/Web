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
var move_left_exports = {};
__export(move_left_exports, {
  MoveLeftIcon: () => MoveLeftIcon
});
module.exports = __toCommonJS(move_left_exports);
var import_create_icon = require("../../create-icon.cjs");
const MoveLeftIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MoveLeftIcon", [["path", { "d": "M6 8L2 12L6 16" }], ["path", { "d": "M2 12H22" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MoveLeftIcon
});

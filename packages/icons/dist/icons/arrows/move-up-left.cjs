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
var move_up_left_exports = {};
__export(move_up_left_exports, {
  MoveUpLeftIcon: () => MoveUpLeftIcon
});
module.exports = __toCommonJS(move_up_left_exports);
var import_create_icon = require("../../create-icon.cjs");
const MoveUpLeftIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MoveUpLeftIcon", [["path", { "d": "M5 11V5H11" }], ["path", { "d": "M5 5L19 19" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MoveUpLeftIcon
});

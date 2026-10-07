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
var clock_arrow_left_exports = {};
__export(clock_arrow_left_exports, {
  ClockArrowLeftIcon: () => ClockArrowLeftIcon
});
module.exports = __toCommonJS(clock_arrow_left_exports);
var import_create_icon = require("../../create-icon.cjs");
const ClockArrowLeftIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ClockArrowLeftIcon", [["path", { "d": "M12 6v6l1.5.8" }], ["path", { "d": "M12.338 21.994a10 10 0 1 1 9.587-8.767" }], ["path", { "d": "M14 18h8" }], ["path", { "d": "m18 22-4-4 4-4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ClockArrowLeftIcon
});

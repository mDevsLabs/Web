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
var clock_arrow_right_exports = {};
__export(clock_arrow_right_exports, {
  ClockArrowRightIcon: () => ClockArrowRightIcon
});
module.exports = __toCommonJS(clock_arrow_right_exports);
var import_create_icon = require("../../create-icon.cjs");
const ClockArrowRightIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ClockArrowRightIcon", [["path", { "d": "M12 6v6l2 1" }], ["path", { "d": "M13.5 21.885A10 10 0 1 1 22 12" }], ["path", { "d": "M14 18h8" }], ["path", { "d": "m18 22 4-4-4-4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ClockArrowRightIcon
});

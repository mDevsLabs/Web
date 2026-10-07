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
var clock_plus_exports = {};
__export(clock_plus_exports, {
  ClockPlusIcon: () => ClockPlusIcon
});
module.exports = __toCommonJS(clock_plus_exports);
var import_create_icon = require("../../create-icon.cjs");
const ClockPlusIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ClockPlusIcon", [["path", { "d": "M12 6v6l3.644 1.822" }], ["path", { "d": "M16 19h6" }], ["path", { "d": "M19 16v6" }], ["path", { "d": "M21.92 13.267a10 10 0 1 0-8.653 8.653" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ClockPlusIcon
});

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
var memory_stick_exports = {};
__export(memory_stick_exports, {
  MemoryStickIcon: () => MemoryStickIcon
});
module.exports = __toCommonJS(memory_stick_exports);
var import_create_icon = require("../../create-icon.cjs");
const MemoryStickIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MemoryStickIcon", [["path", { "d": "M12 12v-2" }], ["path", { "d": "M12 18v-2" }], ["path", { "d": "M16 12v-2" }], ["path", { "d": "M16 18v-2" }], ["path", { "d": "M2 11h1.5" }], ["path", { "d": "M20 18v-2" }], ["path", { "d": "M20.5 11H22" }], ["path", { "d": "M4 18v-2" }], ["path", { "d": "M8 12v-2" }], ["path", { "d": "M8 18v-2" }], ["rect", { "x": "2", "y": "6", "width": "20", "height": "10", "rx": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MemoryStickIcon
});

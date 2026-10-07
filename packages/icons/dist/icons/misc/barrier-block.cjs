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
var barrier_block_exports = {};
__export(barrier_block_exports, {
  BarrierBlockIcon: () => BarrierBlockIcon
});
module.exports = __toCommonJS(barrier_block_exports);
var import_create_icon = require("../../create-icon.cjs");
const BarrierBlockIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BarrierBlockIcon", [["path", { "d": "M4 8a1 1 0 0 1 1 -1h14a1 1 0 0 1 1 1v7a1 1 0 0 1 -1 1h-14a1 1 0 0 1 -1 -1l0 -7" }], ["path", { "d": "M7 16v4" }], ["path", { "d": "M7.5 16l9 -9" }], ["path", { "d": "M13.5 16l6.5 -6.5" }], ["path", { "d": "M4 13.5l6.5 -6.5" }], ["path", { "d": "M17 16v4" }], ["path", { "d": "M5 20h4" }], ["path", { "d": "M15 20h4" }], ["path", { "d": "M17 7v-2" }], ["path", { "d": "M7 7v-2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BarrierBlockIcon
});

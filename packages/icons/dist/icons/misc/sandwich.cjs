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
var sandwich_exports = {};
__export(sandwich_exports, {
  SandwichIcon: () => SandwichIcon
});
module.exports = __toCommonJS(sandwich_exports);
var import_create_icon = require("../../create-icon.cjs");
const SandwichIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SandwichIcon", [["path", { "d": "m2.37 11.223 8.372-6.777a2 2 0 0 1 2.516 0l8.371 6.777" }], ["path", { "d": "M21 15a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-5.25" }], ["path", { "d": "M3 15a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h9" }], ["path", { "d": "m6.67 15 6.13 4.6a2 2 0 0 0 2.8-.4l3.15-4.2" }], ["rect", { "width": "20", "height": "4", "x": "2", "y": "11", "rx": "1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SandwichIcon
});

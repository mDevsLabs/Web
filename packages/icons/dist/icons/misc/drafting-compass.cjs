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
var drafting_compass_exports = {};
__export(drafting_compass_exports, {
  DraftingCompassIcon: () => DraftingCompassIcon
});
module.exports = __toCommonJS(drafting_compass_exports);
var import_create_icon = require("../../create-icon.cjs");
const DraftingCompassIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("DraftingCompassIcon", [["path", { "d": "m12.99 6.74 1.93 3.44" }], ["path", { "d": "M19.136 12a10 10 0 0 1-14.271 0" }], ["path", { "d": "m21 21-2.16-3.84" }], ["path", { "d": "m3 21 8.02-14.26" }], ["circle", { "cx": "12", "cy": "5", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DraftingCompassIcon
});

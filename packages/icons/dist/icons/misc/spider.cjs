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
var spider_exports = {};
__export(spider_exports, {
  SpiderIcon: () => SpiderIcon
});
module.exports = __toCommonJS(spider_exports);
var import_create_icon = require("../../create-icon.cjs");
const SpiderIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SpiderIcon", [["path", { "d": "M5 4v2l5 5" }], ["path", { "d": "M2.5 9.5l1.5 1.5h6" }], ["path", { "d": "M4 19v-2l6 -6" }], ["path", { "d": "M19 4v2l-5 5" }], ["path", { "d": "M21.5 9.5l-1.5 1.5h-6" }], ["path", { "d": "M20 19v-2l-6 -6" }], ["path", { "d": "M8 15a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" }], ["path", { "d": "M10 9a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SpiderIcon
});

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
var ad_circle_exports = {};
__export(ad_circle_exports, {
  AdCircleIcon: () => AdCircleIcon
});
module.exports = __toCommonJS(ad_circle_exports);
var import_create_icon = require("../../create-icon.cjs");
const AdCircleIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AdCircleIcon", [["path", { "d": "M2 12a10 10 0 1 0 20 0a10 10 0 1 0 -20 0" }], ["path", { "d": "M7 15v-4.5a1.5 1.5 0 0 1 3 0v4.5" }], ["path", { "d": "M7 13h3" }], ["path", { "d": "M14 9v6h1a2 2 0 0 0 2 -2v-2a2 2 0 0 0 -2 -2h-1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AdCircleIcon
});

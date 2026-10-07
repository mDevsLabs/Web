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
var cloud_check_exports = {};
__export(cloud_check_exports, {
  CloudCheckIcon: () => CloudCheckIcon
});
module.exports = __toCommonJS(cloud_check_exports);
var import_create_icon = require("../../create-icon.cjs");
const CloudCheckIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CloudCheckIcon", [["path", { "d": "m17 15-5.5 5.5L9 18" }], ["path", { "d": "M5.516 16.07A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 3.501 7.327" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CloudCheckIcon
});

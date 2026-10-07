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
var toothbrush_exports = {};
__export(toothbrush_exports, {
  ToothbrushIcon: () => ToothbrushIcon
});
module.exports = __toCommonJS(toothbrush_exports);
var import_create_icon = require("../../create-icon.cjs");
const ToothbrushIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ToothbrushIcon", [["path", { "d": "M15 11c-2 2-4 2-6 4l-7 7" }], ["path", { "d": "m22 4-7.414 7.414-2-2A2 2 0 0114 6c0-.512.196-1.024.586-1.414A2 2 0 0116 4a2 2 0 013.262-1.552l2.152 2.138" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ToothbrushIcon
});

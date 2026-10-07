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
var globe_lock_exports = {};
__export(globe_lock_exports, {
  GlobeLockIcon: () => GlobeLockIcon
});
module.exports = __toCommonJS(globe_lock_exports);
var import_create_icon = require("../../create-icon.cjs");
const GlobeLockIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("GlobeLockIcon", [["path", { "d": "M15.686 15A14.5 14.5 0 0 1 12 22a14.5 14.5 0 0 1 0-20 10 10 0 1 0 9.542 13" }], ["path", { "d": "M2 12h8.5" }], ["path", { "d": "M20 6V4a2 2 0 1 0-4 0v2" }], ["rect", { "width": "8", "height": "5", "x": "14", "y": "6", "rx": "1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GlobeLockIcon
});

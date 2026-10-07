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
var accessible_exports = {};
__export(accessible_exports, {
  AccessibleIcon: () => AccessibleIcon
});
module.exports = __toCommonJS(accessible_exports);
var import_create_icon = require("../../create-icon.cjs");
const AccessibleIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AccessibleIcon", [["path", { "d": "M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" }], ["path", { "d": "M10 16.5l2 -3l2 3m-2 -3v-2l3 -1m-6 0l3 1" }], ["path", { "d": "M11.5 7.5a.5 .5 0 1 0 1 0a.5 .5 0 1 0 -1 0", "fill": "currentColor" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AccessibleIcon
});

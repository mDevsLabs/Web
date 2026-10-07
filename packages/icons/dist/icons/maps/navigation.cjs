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
var navigation_exports = {};
__export(navigation_exports, {
  NavigationIcon: () => NavigationIcon
});
module.exports = __toCommonJS(navigation_exports);
var import_create_icon = require("../../create-icon.cjs");
const NavigationIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("NavigationIcon", [["polygon", { "points": "3 11 22 2 13 21 11 13 3 11" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  NavigationIcon
});

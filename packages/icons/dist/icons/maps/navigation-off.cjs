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
var navigation_off_exports = {};
__export(navigation_off_exports, {
  NavigationOffIcon: () => NavigationOffIcon
});
module.exports = __toCommonJS(navigation_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const NavigationOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("NavigationOffIcon", [["path", { "d": "M8.43 8.43 3 11l8 2 2 8 2.57-5.43" }], ["path", { "d": "M17.39 11.73 22 2l-9.73 4.61" }], ["line", { "x1": "2", "x2": "22", "y1": "2", "y2": "22" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  NavigationOffIcon
});

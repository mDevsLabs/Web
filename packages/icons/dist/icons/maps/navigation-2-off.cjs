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
var navigation_2_off_exports = {};
__export(navigation_2_off_exports, {
  Navigation2OffIcon: () => Navigation2OffIcon
});
module.exports = __toCommonJS(navigation_2_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const Navigation2OffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Navigation2OffIcon", [["path", { "d": "M9.31 9.31 5 21l7-4 7 4-1.17-3.17" }], ["path", { "d": "M14.53 8.88 12 2l-1.17 3.17" }], ["line", { "x1": "2", "x2": "22", "y1": "2", "y2": "22" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Navigation2OffIcon
});

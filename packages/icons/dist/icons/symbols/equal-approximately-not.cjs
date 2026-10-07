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
var equal_approximately_not_exports = {};
__export(equal_approximately_not_exports, {
  EqualApproximatelyNotIcon: () => EqualApproximatelyNotIcon
});
module.exports = __toCommonJS(equal_approximately_not_exports);
var import_create_icon = require("../../create-icon.cjs");
const EqualApproximatelyNotIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("EqualApproximatelyNotIcon", [["path", { "d": "M5 15a6.5 6.5 0 0 1 7 0 6.5 6.5 0 0 0 7 0" }], ["path", { "d": "M5 9a6.5 6.5 0 0 1 7 0 6.5 6.5 0 0 0 7 0" }], ["line", { "x1": "19", "x2": "5", "y1": "5", "y2": "19" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EqualApproximatelyNotIcon
});

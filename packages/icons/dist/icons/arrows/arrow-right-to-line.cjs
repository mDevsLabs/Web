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
var arrow_right_to_line_exports = {};
__export(arrow_right_to_line_exports, {
  ArrowRightToLineIcon: () => ArrowRightToLineIcon
});
module.exports = __toCommonJS(arrow_right_to_line_exports);
var import_create_icon = require("../../create-icon.js");
const ArrowRightToLineIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ArrowRightToLineIcon", [["path", { "d": "M17 12H3" }], ["path", { "d": "m11 18 6-6-6-6" }], ["path", { "d": "M21 5v14" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ArrowRightToLineIcon
});

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
var strikethrough_exports = {};
__export(strikethrough_exports, {
  StrikethroughIcon: () => StrikethroughIcon
});
module.exports = __toCommonJS(strikethrough_exports);
var import_create_icon = require("../../create-icon.cjs");
const StrikethroughIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("StrikethroughIcon", [["path", { "d": "M16 4H9a3 3 0 0 0-2.83 4" }], ["path", { "d": "M14 12a4 4 0 0 1 0 8H6" }], ["line", { "x1": "4", "x2": "20", "y1": "12", "y2": "12" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  StrikethroughIcon
});

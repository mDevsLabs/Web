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
var line_style_exports = {};
__export(line_style_exports, {
  LineStyleIcon: () => LineStyleIcon
});
module.exports = __toCommonJS(line_style_exports);
var import_create_icon = require("../../create-icon.cjs");
const LineStyleIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("LineStyleIcon", [["path", { "d": "M11 5h2" }], ["path", { "d": "M15 12h6" }], ["path", { "d": "M19 5h2" }], ["path", { "d": "M3 12h6" }], ["path", { "d": "M3 19h18" }], ["path", { "d": "M3 5h2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LineStyleIcon
});

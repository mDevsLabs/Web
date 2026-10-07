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
var arrows_up_from_line_exports = {};
__export(arrows_up_from_line_exports, {
  ArrowsUpFromLineIcon: () => ArrowsUpFromLineIcon
});
module.exports = __toCommonJS(arrows_up_from_line_exports);
var import_create_icon = require("../../create-icon.cjs");
const ArrowsUpFromLineIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ArrowsUpFromLineIcon", [["path", { "d": "m4 6 3-3 3 3" }], ["path", { "d": "M7 17V3" }], ["path", { "d": "m14 6 3-3 3 3" }], ["path", { "d": "M17 17V3" }], ["path", { "d": "M4 21h16" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ArrowsUpFromLineIcon
});

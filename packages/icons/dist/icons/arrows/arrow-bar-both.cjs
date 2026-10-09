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
var arrow_bar_both_exports = {};
__export(arrow_bar_both_exports, {
  ArrowBarBothIcon: () => ArrowBarBothIcon
});
module.exports = __toCommonJS(arrow_bar_both_exports);
var import_create_icon = require("../../create-icon.js");
const ArrowBarBothIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ArrowBarBothIcon", [["path", { "d": "M8 12h-6" }], ["path", { "d": "M5 15l-3 -3l3 -3" }], ["path", { "d": "M22 12h-6" }], ["path", { "d": "M19 15l3 -3l-3 -3" }], ["path", { "d": "M12 4v16" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ArrowBarBothIcon
});

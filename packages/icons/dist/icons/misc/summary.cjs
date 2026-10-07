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
var summary_exports = {};
__export(summary_exports, {
  SummaryIcon: () => SummaryIcon
});
module.exports = __toCommonJS(summary_exports);
var import_create_icon = require("../../create-icon.cjs");
const SummaryIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SummaryIcon", [["path", { "d": "M15 4H7" }], ["path", { "d": "m18 16 3 3-3 3" }], ["path", { "d": "M3 4v13a2 2 0 0 0 2 2h16" }], ["path", { "d": "M7 14h7" }], ["path", { "d": "M7 9h12" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SummaryIcon
});

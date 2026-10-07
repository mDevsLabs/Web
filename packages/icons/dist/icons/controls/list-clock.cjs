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
var list_clock_exports = {};
__export(list_clock_exports, {
  ListClockIcon: () => ListClockIcon
});
module.exports = __toCommonJS(list_clock_exports);
var import_create_icon = require("../../create-icon.cjs");
const ListClockIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ListClockIcon", [["path", { "d": "M16 13v2.2l1.6 1" }], ["path", { "d": "M3 12h3.458" }], ["path", { "d": "M3 19h3.832" }], ["path", { "d": "M3 5h18" }], ["circle", { "cx": "16", "cy": "15", "r": "6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ListClockIcon
});

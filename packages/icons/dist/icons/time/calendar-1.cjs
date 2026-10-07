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
var calendar_1_exports = {};
__export(calendar_1_exports, {
  Calendar1Icon: () => Calendar1Icon
});
module.exports = __toCommonJS(calendar_1_exports);
var import_create_icon = require("../../create-icon.cjs");
const Calendar1Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Calendar1Icon", [["path", { "d": "M11 13h1v4" }], ["path", { "d": "M16 2v3" }], ["path", { "d": "M3 9h18" }], ["path", { "d": "M8 2v3" }], ["rect", { "x": "3", "y": "3", "width": "18", "height": "18", "rx": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Calendar1Icon
});

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
var panel_left_right_dashed_exports = {};
__export(panel_left_right_dashed_exports, {
  PanelLeftRightDashedIcon: () => PanelLeftRightDashedIcon
});
module.exports = __toCommonJS(panel_left_right_dashed_exports);
var import_create_icon = require("../../create-icon.cjs");
const PanelLeftRightDashedIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("PanelLeftRightDashedIcon", [["path", { "d": "M15 10V9" }], ["path", { "d": "M15 15v-1" }], ["path", { "d": "M15 21v-2" }], ["path", { "d": "M15 5V3" }], ["path", { "d": "M9 10V9" }], ["path", { "d": "M9 15v-1" }], ["path", { "d": "M9 21v-2" }], ["path", { "d": "M9 5V3" }], ["rect", { "x": "3", "y": "3", "width": "18", "height": "18", "rx": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PanelLeftRightDashedIcon
});

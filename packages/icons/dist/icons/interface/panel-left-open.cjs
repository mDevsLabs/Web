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
var panel_left_open_exports = {};
__export(panel_left_open_exports, {
  PanelLeftOpenIcon: () => PanelLeftOpenIcon
});
module.exports = __toCommonJS(panel_left_open_exports);
var import_create_icon = require("../../create-icon.cjs");
const PanelLeftOpenIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("PanelLeftOpenIcon", [["rect", { "width": "18", "height": "18", "x": "3", "y": "3", "rx": "2" }], ["path", { "d": "M9 3v18" }], ["path", { "d": "m14 9 3 3-3 3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PanelLeftOpenIcon
});

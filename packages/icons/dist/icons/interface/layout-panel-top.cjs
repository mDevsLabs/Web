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
var layout_panel_top_exports = {};
__export(layout_panel_top_exports, {
  LayoutPanelTopIcon: () => LayoutPanelTopIcon
});
module.exports = __toCommonJS(layout_panel_top_exports);
var import_create_icon = require("../../create-icon.cjs");
const LayoutPanelTopIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("LayoutPanelTopIcon", [["rect", { "width": "18", "height": "7", "x": "3", "y": "3", "rx": "1" }], ["rect", { "width": "7", "height": "7", "x": "3", "y": "14", "rx": "1" }], ["rect", { "width": "7", "height": "7", "x": "14", "y": "14", "rx": "1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LayoutPanelTopIcon
});

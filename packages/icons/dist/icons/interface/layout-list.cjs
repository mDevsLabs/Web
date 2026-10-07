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
var layout_list_exports = {};
__export(layout_list_exports, {
  LayoutListIcon: () => LayoutListIcon
});
module.exports = __toCommonJS(layout_list_exports);
var import_create_icon = require("../../create-icon.cjs");
const LayoutListIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("LayoutListIcon", [["rect", { "width": "7", "height": "7", "x": "3", "y": "3", "rx": "1" }], ["rect", { "width": "7", "height": "7", "x": "3", "y": "14", "rx": "1" }], ["path", { "d": "M14 4h7" }], ["path", { "d": "M14 9h7" }], ["path", { "d": "M14 15h7" }], ["path", { "d": "M14 20h7" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LayoutListIcon
});

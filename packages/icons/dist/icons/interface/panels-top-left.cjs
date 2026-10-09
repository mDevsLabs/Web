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
var panels_top_left_exports = {};
__export(panels_top_left_exports, {
  PanelsTopLeftIcon: () => PanelsTopLeftIcon
});
module.exports = __toCommonJS(panels_top_left_exports);
var import_create_icon = require("../../create-icon.js");
const PanelsTopLeftIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("PanelsTopLeftIcon", [
  ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
  ["path", { d: "M3 9h18" }],
  ["path", { d: "M9 21V9" }]
]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PanelsTopLeftIcon
});

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
var mouse_pointer_click_exports = {};
__export(mouse_pointer_click_exports, {
  MousePointerClickIcon: () => MousePointerClickIcon
});
module.exports = __toCommonJS(mouse_pointer_click_exports);
var import_create_icon = require("../../create-icon.cjs");
const MousePointerClickIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MousePointerClickIcon", [["path", { "d": "M14 4.1 12 6" }], ["path", { "d": "m5.1 8-2.9-.8" }], ["path", { "d": "m6 12-1.9 2" }], ["path", { "d": "M7.2 2.2 8 5.1" }], ["path", { "d": "M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MousePointerClickIcon
});

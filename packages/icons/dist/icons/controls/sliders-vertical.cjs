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
var sliders_vertical_exports = {};
__export(sliders_vertical_exports, {
  SlidersVerticalIcon: () => SlidersVerticalIcon
});
module.exports = __toCommonJS(sliders_vertical_exports);
var import_create_icon = require("../../create-icon.cjs");
const SlidersVerticalIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SlidersVerticalIcon", [["path", { "d": "M10 8h4" }], ["path", { "d": "M12 21v-9" }], ["path", { "d": "M12 8V3" }], ["path", { "d": "M17 16h4" }], ["path", { "d": "M19 12V3" }], ["path", { "d": "M19 21v-5" }], ["path", { "d": "M3 14h4" }], ["path", { "d": "M5 10V3" }], ["path", { "d": "M5 21v-7" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SlidersVerticalIcon
});

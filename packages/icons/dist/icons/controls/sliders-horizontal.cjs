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
var sliders_horizontal_exports = {};
__export(sliders_horizontal_exports, {
  SlidersHorizontalIcon: () => SlidersHorizontalIcon
});
module.exports = __toCommonJS(sliders_horizontal_exports);
var import_create_icon = require("../../create-icon.cjs");
const SlidersHorizontalIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SlidersHorizontalIcon", [["path", { "d": "M10 5H3" }], ["path", { "d": "M12 19H3" }], ["path", { "d": "M14 3v4" }], ["path", { "d": "M16 17v4" }], ["path", { "d": "M21 12h-9" }], ["path", { "d": "M21 19h-5" }], ["path", { "d": "M21 5h-7" }], ["path", { "d": "M8 10v4" }], ["path", { "d": "M8 12H3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SlidersHorizontalIcon
});

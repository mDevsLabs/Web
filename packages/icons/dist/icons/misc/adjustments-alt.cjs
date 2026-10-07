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
var adjustments_alt_exports = {};
__export(adjustments_alt_exports, {
  AdjustmentsAltIcon: () => AdjustmentsAltIcon
});
module.exports = __toCommonJS(adjustments_alt_exports);
var import_create_icon = require("../../create-icon.cjs");
const AdjustmentsAltIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AdjustmentsAltIcon", [["path", { "d": "M4 8h4v4h-4l0 -4" }], ["path", { "d": "M6 4l0 4" }], ["path", { "d": "M6 12l0 8" }], ["path", { "d": "M10 14h4v4h-4l0 -4" }], ["path", { "d": "M12 4l0 10" }], ["path", { "d": "M12 18l0 2" }], ["path", { "d": "M16 5h4v4h-4l0 -4" }], ["path", { "d": "M18 4l0 1" }], ["path", { "d": "M18 9l0 11" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AdjustmentsAltIcon
});

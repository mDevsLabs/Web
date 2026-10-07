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
var adjustments_pin_exports = {};
__export(adjustments_pin_exports, {
  AdjustmentsPinIcon: () => AdjustmentsPinIcon
});
module.exports = __toCommonJS(adjustments_pin_exports);
var import_create_icon = require("../../create-icon.cjs");
const AdjustmentsPinIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AdjustmentsPinIcon", [["path", { "d": "M4 10a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" }], ["path", { "d": "M6 4v4" }], ["path", { "d": "M6 12v8" }], ["path", { "d": "M13.071 14.31a2 2 0 1 0 -1.071 3.69" }], ["path", { "d": "M12 4v10" }], ["path", { "d": "M12 18v2" }], ["path", { "d": "M16 7a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" }], ["path", { "d": "M18 4v1" }], ["path", { "d": "M18 9v2.5" }], ["path", { "d": "M21.121 20.121a3 3 0 1 0 -4.242 0c.418 .419 1.125 1.045 2.121 1.879c1.051 -.89 1.759 -1.516 2.121 -1.879" }], ["path", { "d": "M19 18v.01" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AdjustmentsPinIcon
});

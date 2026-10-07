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
var adjustments_horizontal_exports = {};
__export(adjustments_horizontal_exports, {
  AdjustmentsHorizontalIcon: () => AdjustmentsHorizontalIcon
});
module.exports = __toCommonJS(adjustments_horizontal_exports);
var import_create_icon = require("../../create-icon.cjs");
const AdjustmentsHorizontalIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AdjustmentsHorizontalIcon", [["path", { "d": "M12 6a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }], ["path", { "d": "M4 6l8 0" }], ["path", { "d": "M16 6l4 0" }], ["path", { "d": "M6 12a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }], ["path", { "d": "M4 12l2 0" }], ["path", { "d": "M10 12l10 0" }], ["path", { "d": "M15 18a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }], ["path", { "d": "M4 18l11 0" }], ["path", { "d": "M19 18l1 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AdjustmentsHorizontalIcon
});

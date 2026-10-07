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
var align_box_center_bottom_exports = {};
__export(align_box_center_bottom_exports, {
  AlignBoxCenterBottomIcon: () => AlignBoxCenterBottomIcon
});
module.exports = __toCommonJS(align_box_center_bottom_exports);
var import_create_icon = require("../../create-icon.cjs");
const AlignBoxCenterBottomIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AlignBoxCenterBottomIcon", [["path", { "d": "M3 19v-14a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2" }], ["path", { "d": "M11 17h2" }], ["path", { "d": "M9 14h6" }], ["path", { "d": "M10 11h4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AlignBoxCenterBottomIcon
});

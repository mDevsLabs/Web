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
var align_box_bottom_center_exports = {};
__export(align_box_bottom_center_exports, {
  AlignBoxBottomCenterIcon: () => AlignBoxBottomCenterIcon
});
module.exports = __toCommonJS(align_box_bottom_center_exports);
var import_create_icon = require("../../create-icon.cjs");
const AlignBoxBottomCenterIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AlignBoxBottomCenterIcon", [["path", { "d": "M3 5a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14" }], ["path", { "d": "M9 15v2" }], ["path", { "d": "M12 11v6" }], ["path", { "d": "M15 13v4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AlignBoxBottomCenterIcon
});

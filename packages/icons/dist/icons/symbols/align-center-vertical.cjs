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
var align_center_vertical_exports = {};
__export(align_center_vertical_exports, {
  AlignCenterVerticalIcon: () => AlignCenterVerticalIcon
});
module.exports = __toCommonJS(align_center_vertical_exports);
var import_create_icon = require("../../create-icon.cjs");
const AlignCenterVerticalIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AlignCenterVerticalIcon", [["path", { "d": "M12 2v20" }], ["path", { "d": "M8 10H4a2 2 0 0 1-2-2V6c0-1.1.9-2 2-2h4" }], ["path", { "d": "M16 10h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-4" }], ["path", { "d": "M8 20H7a2 2 0 0 1-2-2v-2c0-1.1.9-2 2-2h1" }], ["path", { "d": "M16 14h1a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AlignCenterVerticalIcon
});

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
var bubble_x_exports = {};
__export(bubble_x_exports, {
  BubbleXIcon: () => BubbleXIcon
});
module.exports = __toCommonJS(bubble_x_exports);
var import_create_icon = require("../../create-icon.cjs");
const BubbleXIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BubbleXIcon", [["path", { "d": "M13.5 18.75c-.345 .09 -.727 .25 -1.1 .25a4.3 4.3 0 0 1 -1.57 -.298l-3.83 2.298v-3.134a2.668 2.668 0 0 1 -1.795 -3.773a4.8 4.8 0 0 1 2.908 -8.933a5.335 5.335 0 0 1 9.194 1.078a5.333 5.333 0 0 1 4.484 6.778" }], ["path", { "d": "M22 22l-5 -5" }], ["path", { "d": "M17 22l5 -5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BubbleXIcon
});

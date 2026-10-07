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
var bubble_tea_exports = {};
__export(bubble_tea_exports, {
  BubbleTeaIcon: () => BubbleTeaIcon
});
module.exports = __toCommonJS(bubble_tea_exports);
var import_create_icon = require("../../create-icon.cjs");
const BubbleTeaIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BubbleTeaIcon", [["path", { "d": "M17.95 9l-1.478 8.69c-.25 1.463 -.374 2.195 -.936 2.631c-1.2 .931 -6.039 .88 -7.172 0c-.562 -.436 -.687 -1.168 -.936 -2.632l-1.478 -8.689" }], ["path", { "d": "M6 9l.514 -1.286a5.908 5.908 0 0 1 10.972 0l.514 1.286" }], ["path", { "d": "M5 9h14" }], ["path", { "d": "M12 9l4 -7" }], ["path", { "d": "M10.01 14h.01" }], ["path", { "d": "M11.02 18h.01" }], ["path", { "d": "M13.02 16h.01" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BubbleTeaIcon
});

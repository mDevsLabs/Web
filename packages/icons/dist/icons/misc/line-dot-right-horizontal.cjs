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
var line_dot_right_horizontal_exports = {};
__export(line_dot_right_horizontal_exports, {
  LineDotRightHorizontalIcon: () => LineDotRightHorizontalIcon
});
module.exports = __toCommonJS(line_dot_right_horizontal_exports);
var import_create_icon = require("../../create-icon.cjs");
const LineDotRightHorizontalIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("LineDotRightHorizontalIcon", [["path", { "d": "M 3 12 L 15 12" }], ["circle", { "cx": "18", "cy": "12", "r": "3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LineDotRightHorizontalIcon
});

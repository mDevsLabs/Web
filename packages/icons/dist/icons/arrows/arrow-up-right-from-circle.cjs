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
var arrow_up_right_from_circle_exports = {};
__export(arrow_up_right_from_circle_exports, {
  ArrowUpRightFromCircleIcon: () => ArrowUpRightFromCircleIcon
});
module.exports = __toCommonJS(arrow_up_right_from_circle_exports);
var import_create_icon = require("../../create-icon.cjs");
const ArrowUpRightFromCircleIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ArrowUpRightFromCircleIcon", [["path", { "d": "M22 12A10 10 0 1 1 12 2" }], ["path", { "d": "M22 2 12 12" }], ["path", { "d": "M16 2h6v6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ArrowUpRightFromCircleIcon
});

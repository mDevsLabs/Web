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
var arrow_up_left_from_circle_exports = {};
__export(arrow_up_left_from_circle_exports, {
  ArrowUpLeftFromCircleIcon: () => ArrowUpLeftFromCircleIcon
});
module.exports = __toCommonJS(arrow_up_left_from_circle_exports);
var import_create_icon = require("../../create-icon.cjs");
const ArrowUpLeftFromCircleIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ArrowUpLeftFromCircleIcon", [["path", { "d": "M2 8V2h6" }], ["path", { "d": "m2 2 10 10" }], ["path", { "d": "M12 2A10 10 0 1 1 2 12" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ArrowUpLeftFromCircleIcon
});

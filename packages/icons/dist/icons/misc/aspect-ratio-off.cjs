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
var aspect_ratio_off_exports = {};
__export(aspect_ratio_off_exports, {
  AspectRatioOffIcon: () => AspectRatioOffIcon
});
module.exports = __toCommonJS(aspect_ratio_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const AspectRatioOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AspectRatioOffIcon", [["path", { "d": "M9 5h10a2 2 0 0 1 2 2v10m-2 2h-14a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2" }], ["path", { "d": "M7 12v-3h2" }], ["path", { "d": "M17 12v1m-2 2h-1" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AspectRatioOffIcon
});

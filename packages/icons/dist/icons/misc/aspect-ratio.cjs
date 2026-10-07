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
var aspect_ratio_exports = {};
__export(aspect_ratio_exports, {
  AspectRatioIcon: () => AspectRatioIcon
});
module.exports = __toCommonJS(aspect_ratio_exports);
var import_create_icon = require("../../create-icon.cjs");
const AspectRatioIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AspectRatioIcon", [["path", { "d": "M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10" }], ["path", { "d": "M7 12v-3h3" }], ["path", { "d": "M17 12v3h-3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AspectRatioIcon
});

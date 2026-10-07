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
var fish_christianity_exports = {};
__export(fish_christianity_exports, {
  FishChristianityIcon: () => FishChristianityIcon
});
module.exports = __toCommonJS(fish_christianity_exports);
var import_create_icon = require("../../create-icon.cjs");
const FishChristianityIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("FishChristianityIcon", [["path", { "d": "M22 7s-5.646 10 -12.308 10c-3.226 .025 -6.194 -1.905 -7.692 -5c1.498 -3.095 4.466 -5.025 7.692 -5c6.662 0 12.308 10 12.308 10" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FishChristianityIcon
});

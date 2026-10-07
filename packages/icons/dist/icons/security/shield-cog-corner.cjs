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
var shield_cog_corner_exports = {};
__export(shield_cog_corner_exports, {
  ShieldCogCornerIcon: () => ShieldCogCornerIcon
});
module.exports = __toCommonJS(shield_cog_corner_exports);
var import_create_icon = require("../../create-icon.cjs");
const ShieldCogCornerIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ShieldCogCornerIcon", [["path", { "d": "M11 22c-3.806-1.45-7-3.966-7-9V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1v4" }], ["path", { "d": "M14.923 16.547 14 16.164" }], ["path", { "d": "m14.923 18.843-.923.383" }], ["path", { "d": "M16.547 14.923 16.164 14" }], ["path", { "d": "m16.547 20.467-.383.924" }], ["path", { "d": "m18.843 14.923.383-.923" }], ["path", { "d": "m19.225 21.391-.382-.924" }], ["path", { "d": "m20.467 16.547.923-.383" }], ["path", { "d": "m20.467 18.843.923.383" }], ["circle", { "cx": "17.695", "cy": "17.695", "r": "3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ShieldCogCornerIcon
});

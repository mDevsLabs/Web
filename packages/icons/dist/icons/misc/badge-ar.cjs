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
var badge_ar_exports = {};
__export(badge_ar_exports, {
  BadgeArIcon: () => BadgeArIcon
});
module.exports = __toCommonJS(badge_ar_exports);
var import_create_icon = require("../../create-icon.cjs");
const BadgeArIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BadgeArIcon", [["path", { "d": "M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10" }], ["path", { "d": "M7 15v-4.5a1.5 1.5 0 0 1 3 0v4.5" }], ["path", { "d": "M7 13h3" }], ["path", { "d": "M14 12h1.5a1.5 1.5 0 0 0 0 -3h-1.5v6m3 0l-2 -3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BadgeArIcon
});

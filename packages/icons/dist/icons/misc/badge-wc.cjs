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
var badge_wc_exports = {};
__export(badge_wc_exports, {
  BadgeWcIcon: () => BadgeWcIcon
});
module.exports = __toCommonJS(badge_wc_exports);
var import_create_icon = require("../../create-icon.cjs");
const BadgeWcIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BadgeWcIcon", [["path", { "d": "M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10" }], ["path", { "d": "M6.5 9l.5 6l2 -4l2 4l.5 -6" }], ["path", { "d": "M17 10.5a1.5 1.5 0 0 0 -3 0v3a1.5 1.5 0 0 0 3 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BadgeWcIcon
});

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
var badge_sd_exports = {};
__export(badge_sd_exports, {
  BadgeSdIcon: () => BadgeSdIcon
});
module.exports = __toCommonJS(badge_sd_exports);
var import_create_icon = require("../../create-icon.cjs");
const BadgeSdIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BadgeSdIcon", [["path", { "d": "M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10" }], ["path", { "d": "M14 9v6h1a2 2 0 0 0 2 -2v-2a2 2 0 0 0 -2 -2h-1" }], ["path", { "d": "M7 14.25c0 .414 .336 .75 .75 .75h1.25a1 1 0 0 0 1 -1v-1a1 1 0 0 0 -1 -1h-1a1 1 0 0 1 -1 -1v-1a1 1 0 0 1 1 -1h1.25a.75 .75 0 0 1 .75 .75" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BadgeSdIcon
});

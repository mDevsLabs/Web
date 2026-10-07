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
var badges_exports = {};
__export(badges_exports, {
  BadgesIcon: () => BadgesIcon
});
module.exports = __toCommonJS(badges_exports);
var import_create_icon = require("../../create-icon.cjs");
const BadgesIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BadgesIcon", [["path", { "d": "M17 17v-4l-5 3l-5 -3v4l5 3l5 -3" }], ["path", { "d": "M17 8v-4l-5 3l-5 -3v4l5 3l5 -3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BadgesIcon
});

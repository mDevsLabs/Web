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
var heading_exports = {};
__export(heading_exports, {
  HeadingIcon: () => HeadingIcon
});
module.exports = __toCommonJS(heading_exports);
var import_create_icon = require("../../create-icon.cjs");
const HeadingIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("HeadingIcon", [["path", { "d": "M6 12h12" }], ["path", { "d": "M6 20V4" }], ["path", { "d": "M18 20V4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HeadingIcon
});

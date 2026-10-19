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
var twitter_exports = {};
__export(twitter_exports, {
  TwitterIcon: () => TwitterIcon,
  XBrandIcon: () => XBrandIcon
});
module.exports = __toCommonJS(twitter_exports);
var import_create_icon = require("../../create-icon.js");
const TwitterIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("TwitterIcon", [
  ["path", { d: "M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" }]
]);
const XBrandIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("XBrandIcon", [
  ["path", { d: "m4 4 11.733 16h4.267l-11.733-16z" }],
  ["path", { d: "m4 20 6.768-6.768m2.46-2.46L20 4" }]
]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TwitterIcon,
  XBrandIcon
});

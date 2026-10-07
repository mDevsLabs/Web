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
var rss_exports = {};
__export(rss_exports, {
  RssIcon: () => RssIcon
});
module.exports = __toCommonJS(rss_exports);
var import_create_icon = require("../../create-icon.cjs");
const RssIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("RssIcon", [["path", { "d": "M4 11a9 9 0 0 1 9 9" }], ["path", { "d": "M4 4a16 16 0 0 1 16 16" }], ["circle", { "cx": "5", "cy": "19", "r": "1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RssIcon
});

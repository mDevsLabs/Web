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
var tag_plus_exports = {};
__export(tag_plus_exports, {
  TagPlusIcon: () => TagPlusIcon
});
module.exports = __toCommonJS(tag_plus_exports);
var import_create_icon = require("../../create-icon.cjs");
const TagPlusIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("TagPlusIcon", [["path", { "d": "M16 13h6" }], ["path", { "d": "m16.5 6.5-3.914-3.914A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l1.79-1.79" }], ["path", { "d": "M19 10v6" }], ["circle", { "cx": "7.5", "cy": "7.5", "r": ".5", "fill": "currentColor" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TagPlusIcon
});

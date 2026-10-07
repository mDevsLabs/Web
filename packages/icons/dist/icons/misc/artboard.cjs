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
var artboard_exports = {};
__export(artboard_exports, {
  ArtboardIcon: () => ArtboardIcon
});
module.exports = __toCommonJS(artboard_exports);
var import_create_icon = require("../../create-icon.cjs");
const ArtboardIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ArtboardIcon", [["path", { "d": "M8 9a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-6a1 1 0 0 1 -1 -1l0 -6" }], ["path", { "d": "M3 8l1 0" }], ["path", { "d": "M3 16l1 0" }], ["path", { "d": "M8 3l0 1" }], ["path", { "d": "M16 3l0 1" }], ["path", { "d": "M20 8l1 0" }], ["path", { "d": "M20 16l1 0" }], ["path", { "d": "M8 20l0 1" }], ["path", { "d": "M16 20l0 1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ArtboardIcon
});

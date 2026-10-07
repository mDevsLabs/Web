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
var cuboid_exports = {};
__export(cuboid_exports, {
  CuboidIcon: () => CuboidIcon
});
module.exports = __toCommonJS(cuboid_exports);
var import_create_icon = require("../../create-icon.cjs");
const CuboidIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CuboidIcon", [["path", { "d": "M10 22v-8" }], ["path", { "d": "M2.336 8.89 10 14l11.715-7.029" }], ["path", { "d": "M22 14a2 2 0 0 1-.971 1.715l-10 6a2 2 0 0 1-2.138-.05l-6-4A2 2 0 0 1 2 16v-6a2 2 0 0 1 .971-1.715l10-6a2 2 0 0 1 2.138.05l6 4A2 2 0 0 1 22 8z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CuboidIcon
});

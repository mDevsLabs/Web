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
var mountain_exports = {};
__export(mountain_exports, {
  MountainIcon: () => MountainIcon
});
module.exports = __toCommonJS(mountain_exports);
var import_create_icon = require("../../create-icon.cjs");
const MountainIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MountainIcon", [["path", { "d": "m8 3 4 8 5-5 5 15H2L8 3z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MountainIcon
});

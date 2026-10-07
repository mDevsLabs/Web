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
var pacman_exports = {};
__export(pacman_exports, {
  PacmanIcon: () => PacmanIcon
});
module.exports = __toCommonJS(pacman_exports);
var import_create_icon = require("../../create-icon.cjs");
const PacmanIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("PacmanIcon", [["path", { "d": "M6.636 5.636a9 9 0 0 1 13.397 .747l-5.619 5.617l5.619 5.617a9 9 0 1 1 -13.397 -11.981" }], ["path", { "d": "M11.5 7.5a1 1 0 1 0 2 0a1 1 0 0 0 -2 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PacmanIcon
});

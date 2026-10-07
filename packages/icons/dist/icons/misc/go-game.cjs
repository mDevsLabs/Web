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
var go_game_exports = {};
__export(go_game_exports, {
  GoGameIcon: () => GoGameIcon
});
module.exports = __toCommonJS(go_game_exports);
var import_create_icon = require("../../create-icon.cjs");
const GoGameIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("GoGameIcon", [["path", { "d": "M4 6a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }], ["path", { "d": "M10 12a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }], ["path", { "d": "M4 18a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }], ["path", { "d": "M16 18a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }], ["path", { "d": "M3 12h7m4 0h7" }], ["path", { "d": "M3 6h1m4 0h13" }], ["path", { "d": "M3 18h1m4 0h8m4 0h1" }], ["path", { "d": "M6 3v1m0 4v8m0 4v1" }], ["path", { "d": "M12 3v7m0 4v7" }], ["path", { "d": "M18 3v13m0 4v1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GoGameIcon
});

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
var list_music_exports = {};
__export(list_music_exports, {
  ListMusicIcon: () => ListMusicIcon
});
module.exports = __toCommonJS(list_music_exports);
var import_create_icon = require("../../create-icon.cjs");
const ListMusicIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ListMusicIcon", [["path", { "d": "M16 5H3" }], ["path", { "d": "M11 12H3" }], ["path", { "d": "M11 19H3" }], ["path", { "d": "M21 16V5" }], ["circle", { "cx": "18", "cy": "16", "r": "3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ListMusicIcon
});

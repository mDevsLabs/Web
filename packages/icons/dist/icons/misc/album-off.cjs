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
var album_off_exports = {};
__export(album_off_exports, {
  AlbumOffIcon: () => AlbumOffIcon
});
module.exports = __toCommonJS(album_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const AlbumOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AlbumOffIcon", [["path", { "d": "M8 4h10a2 2 0 0 1 2 2v10m-.581 3.41c-.362 .364 -.864 .59 -1.419 .59h-12a2 2 0 0 1 -2 -2v-12c0 -.552 .224 -1.052 .585 -1.413" }], ["path", { "d": "M12 4v4m1.503 1.497l.497 -.497l2 2v-7" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AlbumOffIcon
});

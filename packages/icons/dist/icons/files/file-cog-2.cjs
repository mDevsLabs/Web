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
var file_cog_2_exports = {};
__export(file_cog_2_exports, {
  FileCog2Icon: () => FileCog2Icon
});
module.exports = __toCommonJS(file_cog_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const FileCog2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("FileCog2Icon", [["path", { "d": "M15 8a1 1 0 0 1-1-1V2a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8z" }], ["path", { "d": "M20 8v12a2 2 0 0 1-2 2h-4.182" }], ["path", { "d": "m3.305 19.53.923-.382" }], ["path", { "d": "M4 10.592V4a2 2 0 0 1 2-2h8" }], ["path", { "d": "m4.228 16.852-.924-.383" }], ["path", { "d": "m5.852 15.228-.383-.923" }], ["path", { "d": "m5.852 20.772-.383.924" }], ["path", { "d": "m8.148 15.228.383-.923" }], ["path", { "d": "m8.53 21.696-.382-.924" }], ["path", { "d": "m9.773 16.852.922-.383" }], ["path", { "d": "m9.773 19.148.922.383" }], ["circle", { "cx": "7", "cy": "18", "r": "3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FileCog2Icon
});

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
var music_3_exports = {};
__export(music_3_exports, {
  Music3Icon: () => Music3Icon
});
module.exports = __toCommonJS(music_3_exports);
var import_create_icon = require("../../create-icon.cjs");
const Music3Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Music3Icon", [["circle", { "cx": "12", "cy": "18", "r": "4" }], ["path", { "d": "M16 18V2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Music3Icon
});

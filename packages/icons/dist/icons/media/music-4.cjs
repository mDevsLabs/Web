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
var music_4_exports = {};
__export(music_4_exports, {
  Music4Icon: () => Music4Icon
});
module.exports = __toCommonJS(music_4_exports);
var import_create_icon = require("../../create-icon.cjs");
const Music4Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Music4Icon", [["path", { "d": "M9 18V5l12-2v13" }], ["path", { "d": "m9 9 12-2" }], ["circle", { "cx": "6", "cy": "18", "r": "3" }], ["circle", { "cx": "18", "cy": "16", "r": "3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Music4Icon
});

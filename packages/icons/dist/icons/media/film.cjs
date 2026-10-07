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
var film_exports = {};
__export(film_exports, {
  FilmIcon: () => FilmIcon
});
module.exports = __toCommonJS(film_exports);
var import_create_icon = require("../../create-icon.cjs");
const FilmIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("FilmIcon", [["rect", { "width": "18", "height": "18", "x": "3", "y": "3", "rx": "2" }], ["path", { "d": "M7 3v18" }], ["path", { "d": "M3 7.5h4" }], ["path", { "d": "M3 12h18" }], ["path", { "d": "M3 16.5h4" }], ["path", { "d": "M17 3v18" }], ["path", { "d": "M17 7.5h4" }], ["path", { "d": "M17 16.5h4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FilmIcon
});

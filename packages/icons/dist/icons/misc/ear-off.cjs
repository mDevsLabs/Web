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
var ear_off_exports = {};
__export(ear_off_exports, {
  EarOffIcon: () => EarOffIcon
});
module.exports = __toCommonJS(ear_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const EarOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("EarOffIcon", [["path", { "d": "M6 18.5a3.5 3.5 0 1 0 7 0c0-1.57.92-2.52 2.04-3.46" }], ["path", { "d": "M6 8.5c0-.75.13-1.47.36-2.14" }], ["path", { "d": "M8.8 3.15A6.5 6.5 0 0 1 19 8.5c0 1.63-.44 2.81-1.09 3.76" }], ["path", { "d": "M12.5 6A2.5 2.5 0 0 1 15 8.5M10 13a2 2 0 0 0 1.82-1.18" }], ["line", { "x1": "2", "x2": "22", "y1": "2", "y2": "22" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EarOffIcon
});

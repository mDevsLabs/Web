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
var database_x_exports = {};
__export(database_x_exports, {
  DatabaseXIcon: () => DatabaseXIcon
});
module.exports = __toCommonJS(database_x_exports);
var import_create_icon = require("../../create-icon.cjs");
const DatabaseXIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("DatabaseXIcon", [["path", { "d": "m17 17 5 5" }], ["path", { "d": "M19.323 13.744A9 3 0 0 0 21 12" }], ["path", { "d": "M21 13.127V5" }], ["path", { "d": "m22 17-5 5" }], ["path", { "d": "M3 12A9 3 0 0 0 13.563 14.954" }], ["path", { "d": "M3 5V19A9 3 0 0 0 13 21.981" }], ["ellipse", { "cx": "12", "cy": "5", "rx": "9", "ry": "3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DatabaseXIcon
});

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
var database_heart_exports = {};
__export(database_heart_exports, {
  DatabaseHeartIcon: () => DatabaseHeartIcon
});
module.exports = __toCommonJS(database_heart_exports);
var import_create_icon = require("../../create-icon.cjs");
const DatabaseHeartIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("DatabaseHeartIcon", [["path", { "d": "M4 6c0 1.657 3.582 3 8 3s8 -1.343 8 -3s-3.582 -3 -8 -3s-8 1.343 -8 3" }], ["path", { "d": "M4 6v6c0 1.453 2.755 2.665 6.414 2.941" }], ["path", { "d": "M20 11v-5" }], ["path", { "d": "M4 12v6c0 1.579 3.253 2.873 7.383 2.991" }], ["path", { "d": "M18 22l3.35 -3.284a2.143 2.143 0 0 0 .005 -3.071a2.242 2.242 0 0 0 -3.129 -.006l-.224 .22l-.223 -.22a2.242 2.242 0 0 0 -3.128 -.006a2.143 2.143 0 0 0 -.006 3.071l3.355 3.296" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DatabaseHeartIcon
});

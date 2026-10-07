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
var lectern_exports = {};
__export(lectern_exports, {
  LecternIcon: () => LecternIcon
});
module.exports = __toCommonJS(lectern_exports);
var import_create_icon = require("../../create-icon.cjs");
const LecternIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("LecternIcon", [["path", { "d": "M15 13h4a2 2 0 001.901-1.38l1.057-4.333A1 1 0 0021 6H3a1 1 0 00-.958 1.287L3.1 11.621A2 2 0 005.001 13h4" }], ["path", { "d": "M15 22V11a1 1 0 00-1-1h-4a1 1 0 00-1 1v11" }], ["path", { "d": "M18 22H6" }], ["path", { "d": "M18 6V3a1 1 0 00-1-1h-3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LecternIcon
});

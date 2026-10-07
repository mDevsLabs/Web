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
var eye_closed_exports = {};
__export(eye_closed_exports, {
  EyeClosedIcon: () => EyeClosedIcon
});
module.exports = __toCommonJS(eye_closed_exports);
var import_create_icon = require("../../create-icon.cjs");
const EyeClosedIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("EyeClosedIcon", [["path", { "d": "m15 18-.722-3.25" }], ["path", { "d": "M2 8a10.645 10.645 0 0 0 20 0" }], ["path", { "d": "m20 15-1.726-2.05" }], ["path", { "d": "m4 15 1.726-2.05" }], ["path", { "d": "m9 18 .722-3.25" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EyeClosedIcon
});

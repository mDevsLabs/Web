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
var volume_off_exports = {};
__export(volume_off_exports, {
  VolumeOffIcon: () => VolumeOffIcon
});
module.exports = __toCommonJS(volume_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const VolumeOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("VolumeOffIcon", [["path", { "d": "M16 9a5 5 0 0 1 .95 2.293" }], ["path", { "d": "M19.364 5.636a9 9 0 0 1 1.889 9.96" }], ["path", { "d": "m2 2 20 20" }], ["path", { "d": "m7 7-.587.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298V11" }], ["path", { "d": "M9.828 4.172A.686.686 0 0 1 11 4.657v.686" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  VolumeOffIcon
});

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
var blender_exports = {};
__export(blender_exports, {
  BlenderIcon: () => BlenderIcon
});
module.exports = __toCommonJS(blender_exports);
var import_create_icon = require("../../create-icon.cjs");
const BlenderIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BlenderIcon", [["path", { "d": "M8 14a2 2 0 0 0-1.963 1.615l-1.018 5.193A1 1 0 0 0 6 22h12a1 1 0 0 0 .981-1.192l-1.018-5.193A2 2 0 0 0 16 14z" }], ["path", { "d": "m17 2-1 12" }], ["path", { "d": "M8.006 14 7 2" }], ["path", { "d": "M7.565 8.787A5 5 0 0 0 12 8a5 5 0 0 1 4.56-.75" }], ["path", { "d": "M19 2H5a2 2 0 0 0-2 2v5a2 2 0 0 0 .688 1.5" }], ["path", { "d": "M12 18h.01" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BlenderIcon
});

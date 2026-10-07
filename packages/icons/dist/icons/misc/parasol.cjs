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
var parasol_exports = {};
__export(parasol_exports, {
  ParasolIcon: () => ParasolIcon
});
module.exports = __toCommonJS(parasol_exports);
var import_create_icon = require("../../create-icon.cjs");
const ParasolIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ParasolIcon", [["path", { "d": "M12.5 11.134 18.196 21" }], ["path", { "d": "M20.425 5.299a10 10 0 0 0-16.941 9.78c.183.563.843.774 1.355.478L20.16 6.711c.512-.296.66-.973.264-1.413" }], ["path", { "d": "M21 21H3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ParasolIcon
});

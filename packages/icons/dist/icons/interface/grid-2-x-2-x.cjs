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
var grid_2_x_2_x_exports = {};
__export(grid_2_x_2_x_exports, {
  Grid2X2XIcon: () => Grid2X2XIcon
});
module.exports = __toCommonJS(grid_2_x_2_x_exports);
var import_create_icon = require("../../create-icon.cjs");
const Grid2X2XIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Grid2X2XIcon", [["path", { "d": "M12 3v17a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1H3" }], ["path", { "d": "m16.5 16.5 5 5" }], ["path", { "d": "m16.5 21.5 5-5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Grid2X2XIcon
});

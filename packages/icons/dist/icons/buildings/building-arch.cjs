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
var building_arch_exports = {};
__export(building_arch_exports, {
  BuildingArchIcon: () => BuildingArchIcon
});
module.exports = __toCommonJS(building_arch_exports);
var import_create_icon = require("../../create-icon.cjs");
const BuildingArchIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BuildingArchIcon", [["path", { "d": "M3 21l18 0" }], ["path", { "d": "M4 21v-15a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v15" }], ["path", { "d": "M9 21v-8a3 3 0 0 1 6 0v8" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BuildingArchIcon
});

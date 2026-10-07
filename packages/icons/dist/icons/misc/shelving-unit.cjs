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
var shelving_unit_exports = {};
__export(shelving_unit_exports, {
  ShelvingUnitIcon: () => ShelvingUnitIcon
});
module.exports = __toCommonJS(shelving_unit_exports);
var import_create_icon = require("../../create-icon.cjs");
const ShelvingUnitIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ShelvingUnitIcon", [["path", { "d": "M12 12V9a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" }], ["path", { "d": "M16 20v-3a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v3" }], ["path", { "d": "M20 22V2" }], ["path", { "d": "M4 12h16" }], ["path", { "d": "M4 20h16" }], ["path", { "d": "M4 2v20" }], ["path", { "d": "M4 4h16" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ShelvingUnitIcon
});

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
var building_bank_exports = {};
__export(building_bank_exports, {
  BuildingBankIcon: () => BuildingBankIcon
});
module.exports = __toCommonJS(building_bank_exports);
var import_create_icon = require("../../create-icon.cjs");
const BuildingBankIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BuildingBankIcon", [["path", { "d": "M3 21l18 0" }], ["path", { "d": "M3 10l18 0" }], ["path", { "d": "M5 6l7 -3l7 3" }], ["path", { "d": "M4 10l0 11" }], ["path", { "d": "M20 10l0 11" }], ["path", { "d": "M8 14l0 3" }], ["path", { "d": "M12 14l0 3" }], ["path", { "d": "M16 14l0 3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BuildingBankIcon
});

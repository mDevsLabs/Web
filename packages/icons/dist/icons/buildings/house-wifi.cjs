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
var house_wifi_exports = {};
__export(house_wifi_exports, {
  HouseWifiIcon: () => HouseWifiIcon
});
module.exports = __toCommonJS(house_wifi_exports);
var import_create_icon = require("../../create-icon.cjs");
const HouseWifiIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("HouseWifiIcon", [["path", { "d": "M9.5 13.866a4 4 0 0 1 5 .01" }], ["path", { "d": "M12 17h.01" }], ["path", { "d": "M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" }], ["path", { "d": "M7 10.754a8 8 0 0 1 10 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HouseWifiIcon
});

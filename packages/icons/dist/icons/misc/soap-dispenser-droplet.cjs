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
var soap_dispenser_droplet_exports = {};
__export(soap_dispenser_droplet_exports, {
  SoapDispenserDropletIcon: () => SoapDispenserDropletIcon
});
module.exports = __toCommonJS(soap_dispenser_droplet_exports);
var import_create_icon = require("../../create-icon.cjs");
const SoapDispenserDropletIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SoapDispenserDropletIcon", [["path", { "d": "M10.5 2v4" }], ["path", { "d": "M14 2H7a2 2 0 0 0-2 2" }], ["path", { "d": "M19.29 14.76A6.67 6.67 0 0 1 17 11a6.6 6.6 0 0 1-2.29 3.76c-1.15.92-1.71 2.04-1.71 3.19 0 2.22 1.8 4.05 4 4.05s4-1.83 4-4.05c0-1.16-.57-2.26-1.71-3.19" }], ["path", { "d": "M9.607 21H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h7V7a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SoapDispenserDropletIcon
});

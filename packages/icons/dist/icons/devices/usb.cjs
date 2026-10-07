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
var usb_exports = {};
__export(usb_exports, {
  UsbIcon: () => UsbIcon
});
module.exports = __toCommonJS(usb_exports);
var import_create_icon = require("../../create-icon.cjs");
const UsbIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("UsbIcon", [["circle", { "cx": "10", "cy": "7", "r": "1" }], ["circle", { "cx": "4", "cy": "20", "r": "1" }], ["path", { "d": "M4.7 19.3 19 5" }], ["path", { "d": "m21 3-3 1 2 2Z" }], ["path", { "d": "M9.26 7.68 5 12l2 5" }], ["path", { "d": "m10 14 5 2 3.5-3.5" }], ["path", { "d": "m18 12 1-1 1 1-1 1Z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  UsbIcon
});

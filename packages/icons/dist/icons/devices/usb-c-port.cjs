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
var usb_c_port_exports = {};
__export(usb_c_port_exports, {
  UsbCPortIcon: () => UsbCPortIcon
});
module.exports = __toCommonJS(usb_c_port_exports);
var import_create_icon = require("../../create-icon.cjs");
const UsbCPortIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("UsbCPortIcon", [["path", { "d": "M6 12h12" }], ["rect", { "x": "2", "y": "8", "width": "20", "height": "8", "rx": "4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  UsbCPortIcon
});

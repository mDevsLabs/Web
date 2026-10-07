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
var bluetooth_off_exports = {};
__export(bluetooth_off_exports, {
  BluetoothOffIcon: () => BluetoothOffIcon
});
module.exports = __toCommonJS(bluetooth_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const BluetoothOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BluetoothOffIcon", [["path", { "d": "m17 17-5 5V12l-5 5" }], ["path", { "d": "m2 2 20 20" }], ["path", { "d": "M14.5 9.5 17 7l-5-5v4.5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BluetoothOffIcon
});

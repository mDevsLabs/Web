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
var microwave_exports = {};
__export(microwave_exports, {
  MicrowaveIcon: () => MicrowaveIcon
});
module.exports = __toCommonJS(microwave_exports);
var import_create_icon = require("../../create-icon.cjs");
const MicrowaveIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("MicrowaveIcon", [["rect", { "width": "20", "height": "15", "x": "2", "y": "4", "rx": "2" }], ["rect", { "width": "8", "height": "7", "x": "6", "y": "8", "rx": "1" }], ["path", { "d": "M18 8v7" }], ["path", { "d": "M6 19v2" }], ["path", { "d": "M18 19v2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MicrowaveIcon
});

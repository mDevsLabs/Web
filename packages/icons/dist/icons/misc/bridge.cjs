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
var bridge_exports = {};
__export(bridge_exports, {
  BridgeIcon: () => BridgeIcon
});
module.exports = __toCommonJS(bridge_exports);
var import_create_icon = require("../../create-icon.cjs");
const BridgeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BridgeIcon", [["path", { "d": "M10 9.728V16" }], ["path", { "d": "M14 9.728V16" }], ["path", { "d": "M18 20V4" }], ["path", { "d": "m22 11-4-4A7.5 7.5 0 0 1 6 7l-4 4" }], ["path", { "d": "M22 16H2" }], ["path", { "d": "M6 20V4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BridgeIcon
});

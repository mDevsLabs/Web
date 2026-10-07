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
var hand_metal_exports = {};
__export(hand_metal_exports, {
  HandMetalIcon: () => HandMetalIcon
});
module.exports = __toCommonJS(hand_metal_exports);
var import_create_icon = require("../../create-icon.cjs");
const HandMetalIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("HandMetalIcon", [["path", { "d": "M18 12.5V10a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1.4" }], ["path", { "d": "M14 11V9a2 2 0 1 0-4 0v2" }], ["path", { "d": "M10 10.5V5a2 2 0 1 0-4 0v9" }], ["path", { "d": "m7 15-1.76-1.76a2 2 0 0 0-2.83 2.82l3.6 3.6C7.5 21.14 9.2 22 12 22h2a8 8 0 0 0 8-8V7a2 2 0 1 0-4 0v5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HandMetalIcon
});

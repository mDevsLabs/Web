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
var blinds_exports = {};
__export(blinds_exports, {
  BlindsIcon: () => BlindsIcon
});
module.exports = __toCommonJS(blinds_exports);
var import_create_icon = require("../../create-icon.cjs");
const BlindsIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BlindsIcon", [["path", { "d": "M3 3h18" }], ["path", { "d": "M20 7H8" }], ["path", { "d": "M20 11H8" }], ["path", { "d": "M10 19h10" }], ["path", { "d": "M8 15h12" }], ["path", { "d": "M4 3v14" }], ["circle", { "cx": "4", "cy": "19", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BlindsIcon
});

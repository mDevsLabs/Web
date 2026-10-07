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
var lollipop_exports = {};
__export(lollipop_exports, {
  LollipopIcon: () => LollipopIcon
});
module.exports = __toCommonJS(lollipop_exports);
var import_create_icon = require("../../create-icon.cjs");
const LollipopIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("LollipopIcon", [["circle", { "cx": "11", "cy": "11", "r": "8" }], ["path", { "d": "m21 21-4.3-4.3" }], ["path", { "d": "M11 11a2 2 0 0 0 4 0 4 4 0 0 0-8 0 6 6 0 0 0 12 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LollipopIcon
});

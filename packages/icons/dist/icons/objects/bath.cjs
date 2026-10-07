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
var bath_exports = {};
__export(bath_exports, {
  BathIcon: () => BathIcon
});
module.exports = __toCommonJS(bath_exports);
var import_create_icon = require("../../create-icon.cjs");
const BathIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BathIcon", [["path", { "d": "M10 4 8 6" }], ["path", { "d": "M17 19v2" }], ["path", { "d": "M2 12h20" }], ["path", { "d": "M7 19v2" }], ["path", { "d": "M9 5 7.621 3.621A2.121 2.121 0 0 0 4 5v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BathIcon
});

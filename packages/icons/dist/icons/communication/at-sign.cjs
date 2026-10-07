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
var at_sign_exports = {};
__export(at_sign_exports, {
  AtSignIcon: () => AtSignIcon
});
module.exports = __toCommonJS(at_sign_exports);
var import_create_icon = require("../../create-icon.cjs");
const AtSignIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AtSignIcon", [["circle", { "cx": "12", "cy": "12", "r": "4" }], ["path", { "d": "M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AtSignIcon
});

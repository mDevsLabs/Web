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
var sword_exports = {};
__export(sword_exports, {
  SwordIcon: () => SwordIcon
});
module.exports = __toCommonJS(sword_exports);
var import_create_icon = require("../../create-icon.cjs");
const SwordIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SwordIcon", [["path", { "d": "m11 19-6-6" }], ["path", { "d": "m5 21-2-2" }], ["path", { "d": "m8 16-4 4" }], ["path", { "d": "M9.5 17.5 20.414 6.586A2 2 0 0021 5.172V3h-2.172a2 2 0 00-1.414.586L6.5 14.5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SwordIcon
});

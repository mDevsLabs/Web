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
var syringe_exports = {};
__export(syringe_exports, {
  SyringeIcon: () => SyringeIcon
});
module.exports = __toCommonJS(syringe_exports);
var import_create_icon = require("../../create-icon.cjs");
const SyringeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SyringeIcon", [["path", { "d": "m18 2 4 4" }], ["path", { "d": "m17 7 3-3" }], ["path", { "d": "M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5" }], ["path", { "d": "m9 11 4 4" }], ["path", { "d": "m5 19-3 3" }], ["path", { "d": "m14 4 6 6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SyringeIcon
});

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
var egg_off_exports = {};
__export(egg_off_exports, {
  EggOffIcon: () => EggOffIcon
});
module.exports = __toCommonJS(egg_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const EggOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("EggOffIcon", [["path", { "d": "m2 2 20 20" }], ["path", { "d": "M20 14.347V14c0-6-4-12-8-12-1.078 0-2.157.436-3.157 1.19" }], ["path", { "d": "M6.206 6.21C4.871 8.4 4 11.2 4 14a8 8 0 0 0 14.568 4.568" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EggOffIcon
});

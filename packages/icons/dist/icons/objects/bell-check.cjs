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
var bell_check_exports = {};
__export(bell_check_exports, {
  BellCheckIcon: () => BellCheckIcon
});
module.exports = __toCommonJS(bell_check_exports);
var import_create_icon = require("../../create-icon.cjs");
const BellCheckIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BellCheckIcon", [["path", { "d": "M10.268 21a2 2 0 0 0 3.464 0" }], ["path", { "d": "m15 8 2 2 4-4" }], ["path", { "d": "M16.8607 4.4824A6 6 0 0 0 6 8C6 12.499 4.589 13.956 3.262 15.326" }], ["path", { "d": "M3.262 15.326A1 1 0 0 0 4 17H20A1 1 0 0 0 20.74 15.327C20.209 14.779 19.665 14.218 19.203 13.454" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BellCheckIcon
});

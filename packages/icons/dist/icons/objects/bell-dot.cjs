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
var bell_dot_exports = {};
__export(bell_dot_exports, {
  BellDotIcon: () => BellDotIcon
});
module.exports = __toCommonJS(bell_dot_exports);
var import_create_icon = require("../../create-icon.cjs");
const BellDotIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BellDotIcon", [["path", { "d": "M10.268 21a2 2 0 0 0 3.464 0" }], ["path", { "d": "M11.68 2.009A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673c-.824-.85-1.678-1.731-2.21-3.348" }], ["circle", { "cx": "18", "cy": "5", "r": "3" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BellDotIcon
});

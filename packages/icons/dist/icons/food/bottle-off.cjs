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
var bottle_off_exports = {};
__export(bottle_off_exports, {
  BottleOffIcon: () => BottleOffIcon
});
module.exports = __toCommonJS(bottle_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const BottleOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BottleOffIcon", [["path", { "d": "M10 5h4v-2a1 1 0 0 0 -1 -1h-2a1 1 0 0 0 -1 1v2" }], ["path", { "d": "M14 3.5c0 1.626 .507 3.212 1.45 4.537l.05 .07a8.093 8.093 0 0 1 1.5 4.694v.199m0 4v2a2 2 0 0 1 -2 2h-6a2 2 0 0 1 -2 -2v-6.2a8.09 8.09 0 0 1 1.35 -4.474m1.336 -2.63a7.822 7.822 0 0 0 .314 -2.196" }], ["path", { "d": "M7 14.803a2.4 2.4 0 0 0 1 -.803a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 .866 -.142" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BottleOffIcon
});

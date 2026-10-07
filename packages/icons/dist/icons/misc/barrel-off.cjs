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
var barrel_off_exports = {};
__export(barrel_off_exports, {
  BarrelOffIcon: () => BarrelOffIcon
});
module.exports = __toCommonJS(barrel_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const BarrelOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BarrelOffIcon", [["path", { "d": "M8 4h8.722a2 2 0 0 1 1.841 1.22c.958 2.26 1.437 4.52 1.437 6.78a16.35 16.35 0 0 1 -.407 3.609m-.964 3.013l-.066 .158a2 2 0 0 1 -1.841 1.22h-9.444a2 2 0 0 1 -1.841 -1.22c-.958 -2.26 -1.437 -4.52 -1.437 -6.78c0 -2.21 .458 -4.42 1.374 -6.63" }], ["path", { "d": "M14 4c.585 2.337 .913 4.674 .985 7.01m-.114 3.86a33.415 33.415 0 0 1 -.871 5.13" }], ["path", { "d": "M10 4a34.42 34.42 0 0 0 -.366 1.632m-.506 3.501a32.126 32.126 0 0 0 -.128 2.867c0 2.667 .333 5.333 1 8" }], ["path", { "d": "M4.5 16h11.5" }], ["path", { "d": "M19.5 8h-7.5m-4 0h-3.5" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BarrelOffIcon
});

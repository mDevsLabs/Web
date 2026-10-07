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
var carrot_off_exports = {};
__export(carrot_off_exports, {
  CarrotOffIcon: () => CarrotOffIcon
});
module.exports = __toCommonJS(carrot_off_exports);
var import_create_icon = require("../../create-icon.cjs");
const CarrotOffIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CarrotOffIcon", [["path", { "d": "M8.868 8.846c-2.756 3.382 -5.868 12.154 -5.868 12.154s8.75 -3.104 12.134 -5.85m1.667 -2.342a4.486 4.486 0 0 0 -5.589 -5.615" }], ["path", { "d": "M9 13l-1.5 -1.5" }], ["path", { "d": "M22 8s-1.14 -2 -3 -2c-1.406 0 -3 2 -3 2s1.14 2 3 2s3 -2 3 -2" }], ["path", { "d": "M16 2s-2 1.14 -2 3s2 3 2 3s2 -1.577 2 -3c0 -1.86 -2 -3 -2 -3" }], ["path", { "d": "M3 3l18 18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CarrotOffIcon
});

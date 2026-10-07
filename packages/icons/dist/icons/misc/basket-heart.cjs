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
var basket_heart_exports = {};
__export(basket_heart_exports, {
  BasketHeartIcon: () => BasketHeartIcon
});
module.exports = __toCommonJS(basket_heart_exports);
var import_create_icon = require("../../create-icon.cjs");
const BasketHeartIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BasketHeartIcon", [["path", { "d": "M17 10l-2 -6" }], ["path", { "d": "M7 10l2 -6" }], ["path", { "d": "M10.5 20h-3.256a3 3 0 0 1 -2.965 -2.544l-1.255 -7.152a2 2 0 0 1 1.977 -2.304h13.999a2 2 0 0 1 1.977 2.304l-.143 .817" }], ["path", { "d": "M12.602 12.092a2 2 0 0 0 -2.233 3.066" }], ["path", { "d": "M18 22l3.35 -3.284a2.143 2.143 0 0 0 .005 -3.071a2.242 2.242 0 0 0 -3.129 -.006l-.224 .22l-.223 -.22a2.242 2.242 0 0 0 -3.128 -.006a2.143 2.143 0 0 0 -.006 3.071l3.355 3.296" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BasketHeartIcon
});

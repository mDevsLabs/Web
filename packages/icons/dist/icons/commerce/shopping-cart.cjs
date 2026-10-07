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
var shopping_cart_exports = {};
__export(shopping_cart_exports, {
  ShoppingCartIcon: () => ShoppingCartIcon
});
module.exports = __toCommonJS(shopping_cart_exports);
var import_create_icon = require("../../create-icon.cjs");
const ShoppingCartIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ShoppingCartIcon", [["path", { "d": "m2.05 2.05 1.099-.028a1 1 0 0 1 1.008.815l2.69 14.347A1 1 0 0 0 7.83 18H18" }], ["path", { "d": "M4.563 5h16.435a1 1 0 0 1 .981 1.204l-1.026 6.226A2 2 0 0 1 18.962 14H6.25" }], ["circle", { "cx": "18", "cy": "20", "r": "2" }], ["circle", { "cx": "8", "cy": "20", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ShoppingCartIcon
});

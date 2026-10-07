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
var shopping_cart_plus_exports = {};
__export(shopping_cart_plus_exports, {
  ShoppingCartPlusIcon: () => ShoppingCartPlusIcon
});
module.exports = __toCommonJS(shopping_cart_plus_exports);
var import_create_icon = require("../../create-icon.cjs");
const ShoppingCartPlusIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ShoppingCartPlusIcon", [["path", { "d": "M16 5h6" }], ["path", { "d": "M19 2v6" }], ["path", { "d": "m2.05 2.05 1.099-.028a1 1 0 011.008.815l2.69 14.347A1 1 0 007.83 18H18" }], ["path", { "d": "M4.564 5H12" }], ["path", { "d": "M6.25 14h12.712a2 2 0 001.991-1.57l.172-1.041" }], ["circle", { "cx": "18", "cy": "20", "r": "2" }], ["circle", { "cx": "8", "cy": "20", "r": "2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ShoppingCartPlusIcon
});

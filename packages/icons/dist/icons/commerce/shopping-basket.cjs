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
var shopping_basket_exports = {};
__export(shopping_basket_exports, {
  ShoppingBasketIcon: () => ShoppingBasketIcon
});
module.exports = __toCommonJS(shopping_basket_exports);
var import_create_icon = require("../../create-icon.cjs");
const ShoppingBasketIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ShoppingBasketIcon", [["path", { "d": "m15 11-1 9" }], ["path", { "d": "m19 11-4-7" }], ["path", { "d": "M2 11h20" }], ["path", { "d": "m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4" }], ["path", { "d": "M4.5 15.5h15" }], ["path", { "d": "m5 11 4-7" }], ["path", { "d": "m9 11 1 9" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ShoppingBasketIcon
});

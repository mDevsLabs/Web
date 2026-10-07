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
var shopping_bag_exports = {};
__export(shopping_bag_exports, {
  ShoppingBagIcon: () => ShoppingBagIcon
});
module.exports = __toCommonJS(shopping_bag_exports);
var import_create_icon = require("../../create-icon.cjs");
const ShoppingBagIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("ShoppingBagIcon", [["path", { "d": "M16 10a4 4 0 0 1-8 0" }], ["path", { "d": "M3.103 6.034h17.794" }], ["path", { "d": "M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ShoppingBagIcon
});

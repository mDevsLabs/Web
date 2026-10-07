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
var basket_search_exports = {};
__export(basket_search_exports, {
  BasketSearchIcon: () => BasketSearchIcon
});
module.exports = __toCommonJS(basket_search_exports);
var import_create_icon = require("../../create-icon.cjs");
const BasketSearchIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BasketSearchIcon", [["path", { "d": "M17 10l-2 -6" }], ["path", { "d": "M7 10l2 -6" }], ["path", { "d": "M11 20h-3.756a3 3 0 0 1 -2.965 -2.544l-1.255 -7.152a2 2 0 0 1 1.977 -2.304h13.999a2 2 0 0 1 1.977 2.304l-.215 1.227" }], ["path", { "d": "M13.483 12.658a2 2 0 1 0 -2.162 3.224" }], ["path", { "d": "M15 18a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" }], ["path", { "d": "M20.2 20.2l1.8 1.8" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BasketSearchIcon
});

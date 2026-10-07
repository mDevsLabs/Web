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
var basket_code_exports = {};
__export(basket_code_exports, {
  BasketCodeIcon: () => BasketCodeIcon
});
module.exports = __toCommonJS(basket_code_exports);
var import_create_icon = require("../../create-icon.cjs");
const BasketCodeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BasketCodeIcon", [["path", { "d": "M17 10l-2 -6" }], ["path", { "d": "M7 10l2 -6" }], ["path", { "d": "M11 20h-3.756a3 3 0 0 1 -2.965 -2.544l-1.255 -7.152a2 2 0 0 1 1.977 -2.304h13.999a2 2 0 0 1 1.977 2.304c-.21 1.202 -.37 2.104 -.475 2.705" }], ["path", { "d": "M10 14a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" }], ["path", { "d": "M20 21l2 -2l-2 -2" }], ["path", { "d": "M17 17l-2 2l2 2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BasketCodeIcon
});

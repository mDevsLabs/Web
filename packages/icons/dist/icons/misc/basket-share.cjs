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
var basket_share_exports = {};
__export(basket_share_exports, {
  BasketShareIcon: () => BasketShareIcon
});
module.exports = __toCommonJS(basket_share_exports);
var import_create_icon = require("../../create-icon.cjs");
const BasketShareIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BasketShareIcon", [["path", { "d": "M17 10l-2 -6" }], ["path", { "d": "M7 10l2 -6" }], ["path", { "d": "M12.5 20h-5.256a3 3 0 0 1 -2.965 -2.544l-1.255 -7.152a2 2 0 0 1 1.977 -2.304h13.999a2 2 0 0 1 1.977 2.304l-.478 2.723" }], ["path", { "d": "M14 14a2 2 0 1 0 -2 2" }], ["path", { "d": "M16 22l5 -5" }], ["path", { "d": "M21 21.5v-4.5h-4.5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BasketShareIcon
});

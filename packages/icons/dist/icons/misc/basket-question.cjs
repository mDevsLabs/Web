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
var basket_question_exports = {};
__export(basket_question_exports, {
  BasketQuestionIcon: () => BasketQuestionIcon
});
module.exports = __toCommonJS(basket_question_exports);
var import_create_icon = require("../../create-icon.cjs");
const BasketQuestionIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BasketQuestionIcon", [["path", { "d": "M17 10l-2 -6" }], ["path", { "d": "M7 10l2 -6" }], ["path", { "d": "M15 20h-7.756a3 3 0 0 1 -2.965 -2.544l-1.255 -7.152a2 2 0 0 1 1.977 -2.304h13.999a2 2 0 0 1 1.977 2.304l-.161 .918" }], ["path", { "d": "M12 16a2 2 0 1 0 0 -4a2 2 0 0 0 0 4" }], ["path", { "d": "M19 22v.01" }], ["path", { "d": "M19 19a2.003 2.003 0 0 0 .914 -3.782a1.98 1.98 0 0 0 -2.414 .483" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BasketQuestionIcon
});

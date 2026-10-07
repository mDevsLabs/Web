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
var bean_exports = {};
__export(bean_exports, {
  BeanIcon: () => BeanIcon
});
module.exports = __toCommonJS(bean_exports);
var import_create_icon = require("../../create-icon.cjs");
const BeanIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("BeanIcon", [["path", { "d": "M10.165 6.598C9.954 7.478 9.64 8.36 9 9c-.64.64-1.521.954-2.402 1.165A6 6 0 0 0 8 22c7.732 0 14-6.268 14-14a6 6 0 0 0-11.835-1.402Z" }], ["path", { "d": "M5.341 10.62a4 4 0 1 0 5.279-5.28" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BeanIcon
});

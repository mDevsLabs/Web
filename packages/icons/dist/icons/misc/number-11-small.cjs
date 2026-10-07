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
var number_11_small_exports = {};
__export(number_11_small_exports, {
  Number11SmallIcon: () => Number11SmallIcon
});
module.exports = __toCommonJS(number_11_small_exports);
var import_create_icon = require("../../create-icon.cjs");
const Number11SmallIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Number11SmallIcon", [["path", { "d": "M8 8h1v8" }], ["path", { "d": "M14 8h1v8" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Number11SmallIcon
});

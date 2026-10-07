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
var math_1_divide_3_exports = {};
__export(math_1_divide_3_exports, {
  Math1Divide3Icon: () => Math1Divide3Icon
});
module.exports = __toCommonJS(math_1_divide_3_exports);
var import_create_icon = require("../../create-icon.cjs");
const Math1Divide3Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Math1Divide3Icon", [["path", { "d": "M10 15.5a.5 .5 0 0 1 .5 -.5h2a1.5 1.5 0 0 1 0 3h-1.167h1.167a1.5 1.5 0 0 1 0 3h-2a.5 .5 0 0 1 -.5 -.5" }], ["path", { "d": "M5 12h14" }], ["path", { "d": "M10 5l2 -2v6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Math1Divide3Icon
});

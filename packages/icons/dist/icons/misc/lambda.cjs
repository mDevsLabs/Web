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
var lambda_exports = {};
__export(lambda_exports, {
  LambdaIcon: () => LambdaIcon
});
module.exports = __toCommonJS(lambda_exports);
var import_create_icon = require("../../create-icon.cjs");
const LambdaIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("LambdaIcon", [["path", { "d": "M11.38 10 5 20" }], ["path", { "d": "M19 18a2 2 0 01-2 2c-4.87-.003-5.052-16-10-16a2 2 0 00-2 2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LambdaIcon
});

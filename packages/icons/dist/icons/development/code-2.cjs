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
var code_2_exports = {};
__export(code_2_exports, {
  Code2Icon: () => Code2Icon
});
module.exports = __toCommonJS(code_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const Code2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Code2Icon", [["path", { "d": "m18 16 4-4-4-4" }], ["path", { "d": "m6 8-4 4 4 4" }], ["path", { "d": "m14.5 4-5 16" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Code2Icon
});

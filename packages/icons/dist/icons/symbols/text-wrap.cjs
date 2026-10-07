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
var text_wrap_exports = {};
__export(text_wrap_exports, {
  TextWrapIcon: () => TextWrapIcon
});
module.exports = __toCommonJS(text_wrap_exports);
var import_create_icon = require("../../create-icon.cjs");
const TextWrapIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("TextWrapIcon", [["path", { "d": "m16 16-3 3 3 3" }], ["path", { "d": "M3 12h14.5a1 1 0 0 1 0 7H13" }], ["path", { "d": "M3 19h6" }], ["path", { "d": "M3 5h18" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TextWrapIcon
});

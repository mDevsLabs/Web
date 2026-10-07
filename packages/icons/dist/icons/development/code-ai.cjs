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
var code_ai_exports = {};
__export(code_ai_exports, {
  CodeAiIcon: () => CodeAiIcon
});
module.exports = __toCommonJS(code_ai_exports);
var import_create_icon = require("../../create-icon.cjs");
const CodeAiIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("CodeAiIcon", [["path", { "d": "M7 8l-4 4l4 4" }], ["path", { "d": "M17 8l3.111 3.111" }], ["path", { "d": "M14 4l-2.175 8.7" }], ["path", { "d": "M14 21v-4a2 2 0 1 1 4 0v4" }], ["path", { "d": "M14 19h4" }], ["path", { "d": "M21 15v6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CodeAiIcon
});

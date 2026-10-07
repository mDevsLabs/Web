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
var signpost_big_exports = {};
__export(signpost_big_exports, {
  SignpostBigIcon: () => SignpostBigIcon
});
module.exports = __toCommonJS(signpost_big_exports);
var import_create_icon = require("../../create-icon.cjs");
const SignpostBigIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SignpostBigIcon", [["path", { "d": "M10 9H4L2 7l2-2h6" }], ["path", { "d": "M14 5h6l2 2-2 2h-6" }], ["path", { "d": "M10 22V4a2 2 0 1 1 4 0v18" }], ["path", { "d": "M8 22h8" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SignpostBigIcon
});

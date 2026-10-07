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
var auth_2fa_exports = {};
__export(auth_2fa_exports, {
  Auth2faIcon: () => Auth2faIcon
});
module.exports = __toCommonJS(auth_2fa_exports);
var import_create_icon = require("../../create-icon.cjs");
const Auth2faIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Auth2faIcon", [["path", { "d": "M7 16h-4l3.47 -4.66a2 2 0 1 0 -3.47 -1.54" }], ["path", { "d": "M10 16v-8h4" }], ["path", { "d": "M10 12l3 0" }], ["path", { "d": "M17 16v-6a2 2 0 0 1 4 0v6" }], ["path", { "d": "M17 13l4 0" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Auth2faIcon
});

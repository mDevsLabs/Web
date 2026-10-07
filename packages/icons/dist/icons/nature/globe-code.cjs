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
var globe_code_exports = {};
__export(globe_code_exports, {
  GlobeCodeIcon: () => GlobeCodeIcon
});
module.exports = __toCommonJS(globe_code_exports);
var import_create_icon = require("../../create-icon.cjs");
const GlobeCodeIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("GlobeCodeIcon", [["path", { "d": "M15.5 10 13 7.5 15.5 5" }], ["path", { "d": "M15.861 14A14.5 14.5 0 0112 22a14.48 14.48 0 010-20 10 10 0 109.888 11.5" }], ["path", { "d": "M19.5 5 22 7.5 19.5 10" }], ["path", { "d": "M2 12h8.5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GlobeCodeIcon
});

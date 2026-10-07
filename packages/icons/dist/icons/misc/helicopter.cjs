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
var helicopter_exports = {};
__export(helicopter_exports, {
  HelicopterIcon: () => HelicopterIcon
});
module.exports = __toCommonJS(helicopter_exports);
var import_create_icon = require("../../create-icon.cjs");
const HelicopterIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("HelicopterIcon", [["path", { "d": "M11 17v4" }], ["path", { "d": "M14 3v8a2 2 0 0 0 2 2h5.865" }], ["path", { "d": "M17 17v4" }], ["path", { "d": "M18 17a4 4 0 0 0 4-4 8 6 0 0 0-8-6 6 5 0 0 0-6 5v3a2 2 0 0 0 2 2z" }], ["path", { "d": "M2 10v5" }], ["path", { "d": "M6 3h16" }], ["path", { "d": "M7 21h14" }], ["path", { "d": "M8 13H2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HelicopterIcon
});

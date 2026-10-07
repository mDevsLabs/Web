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
var toml_exports = {};
__export(toml_exports, {
  TomlIcon: () => TomlIcon
});
module.exports = __toCommonJS(toml_exports);
var import_create_icon = require("../../create-icon.cjs");
const TomlIcon = /* @__PURE__ */ (0, import_create_icon.createIcon)("TomlIcon", [["path", { "d": "M1.499 8h3" }], ["path", { "d": "M2.999 8v8" }], ["path", { "d": "M8.5 8a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1 -3 0v-5a1.5 1.5 0 0 1 1.5 -1.5" }], ["path", { "d": "M13 16v-8l2 5l2 -5v8" }], ["path", { "d": "M20 8v8h2.5" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TomlIcon
});

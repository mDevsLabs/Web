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
var spell_check_2_exports = {};
__export(spell_check_2_exports, {
  SpellCheck2Icon: () => SpellCheck2Icon
});
module.exports = __toCommonJS(spell_check_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const SpellCheck2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("SpellCheck2Icon", [["path", { "d": "m6 16 6-12 6 12" }], ["path", { "d": "M8 12h8" }], ["path", { "d": "M4 21c1.1 0 1.1-1 2.3-1s1.1 1 2.3 1c1.1 0 1.1-1 2.3-1 1.1 0 1.1 1 2.3 1 1.1 0 1.1-1 2.3-1 1.1 0 1.1 1 2.3 1 1.1 0 1.1-1 2.3-1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SpellCheck2Icon
});

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
var armchair_2_exports = {};
__export(armchair_2_exports, {
  Armchair2Icon: () => Armchair2Icon
});
module.exports = __toCommonJS(armchair_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const Armchair2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Armchair2Icon", [["path", { "d": "M5 10v-4a3 3 0 0 1 3 -3h8a3 3 0 0 1 3 3v4" }], ["path", { "d": "M16 15v-2a3 3 0 1 1 3 3v3h-14v-3a3 3 0 1 1 3 -3v2" }], ["path", { "d": "M8 12h8" }], ["path", { "d": "M7 19v2" }], ["path", { "d": "M17 19v2" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Armchair2Icon
});

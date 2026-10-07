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
var a_b_2_exports = {};
__export(a_b_2_exports, {
  AB2Icon: () => AB2Icon
});
module.exports = __toCommonJS(a_b_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const AB2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("AB2Icon", [["path", { "d": "M16 21h3c.81 0 1.48 -.67 1.48 -1.48l.02 -.02c0 -.82 -.69 -1.5 -1.5 -1.5h-3v3" }], ["path", { "d": "M16 15h2.5c.84 -.01 1.5 .66 1.5 1.5s-.66 1.5 -1.5 1.5h-2.5v-3" }], ["path", { "d": "M4 9v-4c0 -1.036 .895 -2 2 -2s2 .964 2 2v4" }], ["path", { "d": "M2.99 11.98a9 9 0 0 0 9 9m9 -9a9 9 0 0 0 -9 -9" }], ["path", { "d": "M8 7h-4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AB2Icon
});

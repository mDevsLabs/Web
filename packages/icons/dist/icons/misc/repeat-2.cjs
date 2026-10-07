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
var repeat_2_exports = {};
__export(repeat_2_exports, {
  Repeat2Icon: () => Repeat2Icon
});
module.exports = __toCommonJS(repeat_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const Repeat2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Repeat2Icon", [["path", { "d": "m2 9 3-3 3 3" }], ["path", { "d": "M13 18H7a2 2 0 0 1-2-2V6" }], ["path", { "d": "m22 15-3 3-3-3" }], ["path", { "d": "M11 6h6a2 2 0 0 1 2 2v10" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Repeat2Icon
});

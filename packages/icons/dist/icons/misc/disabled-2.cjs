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
var disabled_2_exports = {};
__export(disabled_2_exports, {
  Disabled2Icon: () => Disabled2Icon
});
module.exports = __toCommonJS(disabled_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const Disabled2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Disabled2Icon", [["path", { "d": "M15 6a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" }], ["path", { "d": "M9 11a5 5 0 1 0 3.95 7.95" }], ["path", { "d": "M19 20l-4 -5h-4l3 -5l-4 -3l-4 1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Disabled2Icon
});

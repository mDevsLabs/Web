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
var paintbrush_2_exports = {};
__export(paintbrush_2_exports, {
  Paintbrush2Icon: () => Paintbrush2Icon
});
module.exports = __toCommonJS(paintbrush_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const Paintbrush2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Paintbrush2Icon", [["path", { "d": "M10 2v2" }], ["path", { "d": "M14 2v4" }], ["path", { "d": "M17 2a1 1 0 0 1 1 1v9H6V3a1 1 0 0 1 1-1z" }], ["path", { "d": "M6 12a1 1 0 0 0-1 1v1a2 2 0 0 0 2 2h2a1 1 0 0 1 1 1v2.9a2 2 0 1 0 4 0V17a1 1 0 0 1 1-1h2a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Paintbrush2Icon
});

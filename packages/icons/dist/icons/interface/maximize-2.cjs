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
var maximize_2_exports = {};
__export(maximize_2_exports, {
  Maximize2Icon: () => Maximize2Icon
});
module.exports = __toCommonJS(maximize_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const Maximize2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("Maximize2Icon", [["path", { "d": "M15 3h6v6" }], ["path", { "d": "m21 3-7 7" }], ["path", { "d": "m3 21 7-7" }], ["path", { "d": "M9 21H3v-6" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Maximize2Icon
});

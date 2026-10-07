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
var plug_zap_2_exports = {};
__export(plug_zap_2_exports, {
  PlugZap2Icon: () => PlugZap2Icon
});
module.exports = __toCommonJS(plug_zap_2_exports);
var import_create_icon = require("../../create-icon.cjs");
const PlugZap2Icon = /* @__PURE__ */ (0, import_create_icon.createIcon)("PlugZap2Icon", [["path", { "d": "M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z" }], ["path", { "d": "m2 22 3-3" }], ["path", { "d": "M7.5 13.5 10 11" }], ["path", { "d": "M10.5 16.5 13 14" }], ["path", { "d": "m18 3-4 4h6l-4 4" }]]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PlugZap2Icon
});
